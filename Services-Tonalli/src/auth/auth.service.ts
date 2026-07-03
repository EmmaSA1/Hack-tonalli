import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { StellarService } from '../stellar/stellar.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly stellarService: StellarService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // Access token: 15 minutes
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: '15m' },
    );

    // Refresh token: 7 days (raw token)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Store hashed refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save({
      tokenHash: refreshTokenHash,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens() {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async register(dto: RegisterDto) {
    // Age validation (18+)
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }
      if (age < 18) {
        throw new BadRequestException(
          'Debes ser mayor de 18 años para registrarte en Tonalli',
        );
      }
    }

    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) throw new ConflictException('Username already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const stellarKeypair = this.stellarService.createKeypair();

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      displayName: dto.displayName || dto.username,
      city: dto.city || 'Ciudad de México',
      character: dto.character || 'chima',
      dateOfBirth: dto.dateOfBirth || undefined,
      stellarPublicKey: stellarKeypair.publicKey,
      stellarSecretKey: stellarKeypair.secretKey,
      xp: 0,
      totalXp: 0,
      currentStreak: 0,
    });

    this.stellarService
      .fundWithFriendbot(stellarKeypair.publicKey)
      .then((result) => {
        if (result.success) {
          this.usersService.update(user.id, { isFunded: true });
        }
      });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        xp: user.xp,
        totalXp: user.totalXp,
        currentStreak: user.currentStreak,
        walletAddress: user.stellarPublicKey,
        externalWalletAddress: user.externalWalletAddress || null,
        walletType: user.walletType || 'custodial',
        character: user.character,
        role: user.role || 'user',
        plan: user.plan || 'free',
        isFirstLogin: user.isFirstLogin,
        companion: user.companion,
        avatarType: user.avatarType,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        xp: user.xp,
        totalXp: user.totalXp,
        currentStreak: user.currentStreak,
        walletAddress: user.stellarPublicKey,
        externalWalletAddress: user.externalWalletAddress || null,
        walletType: user.walletType || 'custodial',
        character: user.character,
        role: user.role || 'user',
        plan: user.plan || 'free',
        isFirstLogin: user.isFirstLogin,
        companion: user.companion,
        avatarType: user.avatarType,
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    // Find all non-revoked, non-expired refresh tokens
    const storedTokens = await this.refreshTokenRepository.find({
      where: {
        isRevoked: false,
        expiresAt: LessThan(new Date(Date.now() + 1000 * 60 * 60 * 24 * 8)), // Not checking exact expiry here
      },
      relations: ['user'],
    });

    // Check each token hash
    let matchedToken: RefreshToken | null = null;
    for (const token of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete({ id: matchedToken.id });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign(
      {
        sub: matchedToken.user.id,
        email: matchedToken.user.email,
        role: matchedToken.user.role,
      },
      { expiresIn: '15m' },
    );

    return {
      access_token: accessToken,
    };
  }

  /**
   * Logout: revoke refresh token
   */
  async logout(refreshToken: string) {
    // Find and revoke the refresh token
    const storedTokens = await this.refreshTokenRepository.find({
      where: { isRevoked: false },
    });

    for (const token of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
      if (isMatch) {
        await this.refreshTokenRepository.update(
          { id: token.id },
          { isRevoked: true },
        );
        return { message: 'Logged out successfully' };
      }
    }

    // Even if token not found, return success (idempotent)
    return { message: 'Logged out successfully' };
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }
}
