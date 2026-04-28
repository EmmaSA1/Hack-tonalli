import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { StellarService } from '../stellar/stellar.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly stellarService: StellarService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    // Age validation (18+)
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        throw new BadRequestException('Debes ser mayor de 18 años para registrarte en Tonalli');
      }
    }

    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername)
      throw new ConflictException('Username already taken');

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

    this.stellarService.fundWithFriendbot(stellarKeypair.publicKey).then(
      (result) => {
        if (result.success) {
          this.usersService.update(user.id, { isFunded: true });
        }
      },
    );

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token,
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

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token,
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

  async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = crypto.randomUUID();
    const secret = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(secret, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.save({
      userId,
      tokenId,
      tokenHash,
      expiresAt,
    });

    return `${tokenId}.${secret}`;
  }

  async refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const [tokenId, secret] = parts;

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenId, expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(secret, storedToken.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = storedToken.user;

    const newRefreshToken = await this.dataSource.transaction(async (manager) => {
      await manager.delete(RefreshToken, storedToken.id);
      const newTokenId = crypto.randomUUID();
      const newSecret = crypto.randomUUID();
      const tokenHash = await bcrypt.hash(newSecret, 10);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await manager.save(RefreshToken, {
        tokenId: newTokenId,
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      return `${newTokenId}.${newSecret}`;
    });

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      access_token,
      refresh_token: newRefreshToken,
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

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.refreshTokenRepo.delete({ userId });
  }
}
