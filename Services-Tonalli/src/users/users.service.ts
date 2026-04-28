import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as StellarSdk from '@stellar/stellar-sdk';
import { User } from './entities/user.entity';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(data: Partial<User>): Promise<User> {
    // Encrypt the Stellar secret key before persisting to the database
    if (data.stellarSecretKey) {
      this.logger.log('[AUDIT] Encrypting new user Stellar secret key before storage');
      data = { ...data, stellarSecretKey: this.encryptionService.encrypt(data.stellarSecretKey) };
    }
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Encrypt if the caller is updating the secret key (e.g. after key migration)
    if (data.stellarSecretKey && !this.encryptionService.isEncrypted(data.stellarSecretKey)) {
      this.logger.log(`[AUDIT] Encrypting updated Stellar secret key for user ${id}`);
      data = { ...data, stellarSecretKey: this.encryptionService.encrypt(data.stellarSecretKey) };
    }
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async addXP(userId: string, xp: number): Promise<User> {
    const user = await this.findById(userId);
    user.xp += xp;
    user.totalXp += xp;
    return this.userRepository.save(user);
  }

  async updateStreak(userId: string): Promise<User> {
    const user = await this.findById(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = user.lastActivityDate;

    if (lastActivity === today) {
      return user;
    }

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    if (lastActivity === yesterday) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }

    user.lastActivityDate = today;
    return this.userRepository.save(user);
  }

  async setupUser(userId: string, companion: string, avatarType: string): Promise<User> {
    await this.userRepository.update(userId, {
      companion,
      avatarType,
      isFirstLogin: false,
    });
    return this.findById(userId);
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.findById(userId);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      city: user.city,
      xp: user.xp,
      totalXp: user.totalXp,
      currentStreak: user.currentStreak,
      lastActivityDate: user.lastActivityDate,
      walletAddress: user.stellarPublicKey,
      externalWalletAddress: user.externalWalletAddress || null,
      walletType: user.walletType || 'custodial',
      character: user.character,
      plan: user.plan || 'free',
      isFirstLogin: user.isFirstLogin,
      companion: user.companion,
      avatarType: user.avatarType,
      createdAt: user.createdAt,
    };
  }

  async upgradePlan(userId: string, plan: 'free' | 'pro' | 'max'): Promise<User> {
    const user = await this.findById(userId);
    user.plan = plan;
    return this.userRepository.save(user);
  }

  // ── Wallet Methods ──────────────────────────────────────────────────────

  async connectExternalWallet(
    userId: string,
    externalAddress: string,
  ): Promise<User> {
    try {
      StellarSdk.Keypair.fromPublicKey(externalAddress);
    } catch {
      throw new BadRequestException(
        'Invalid Stellar address. Must be a valid ed25519 public key (starts with G)',
      );
    }

    const user = await this.findById(userId);
    user.externalWalletAddress = externalAddress;
    user.walletType = 'hybrid';
    return this.userRepository.save(user);
  }

  async disconnectExternalWallet(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.externalWalletAddress = '' as any;
    user.walletType = 'custodial';
    return this.userRepository.save(user);
  }

  async exportSecretKey(
    userId: string,
    password: string,
  ): Promise<{ secretKey: string }> {
    this.logger.log(`[AUDIT] Secret key export requested for user ${userId} ts=${new Date().toISOString()}`);

    const user = await this.findById(userId);

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      this.logger.warn(`[AUDIT] Failed secret key export attempt for user ${userId} — wrong password`);
      throw new UnauthorizedException('Incorrect password');
    }

    if (!user.stellarSecretKey) {
      throw new NotFoundException('No custodial wallet found');
    }

    // Decrypt the stored key (handles both encrypted and legacy plaintext values)
    const plainSecretKey = this.encryptionService.decrypt(user.stellarSecretKey);

    this.logger.log(`[AUDIT] Secret key exported successfully for user ${userId}`);
    return { secretKey: plainSecretKey };
  }

  async getWalletInfo(userId: string): Promise<{
    custodialAddress: string | null;
    externalAddress: string | null;
    walletType: string;
  }> {
    const user = await this.findById(userId);
    return {
      custodialAddress: user.stellarPublicKey || null,
      externalAddress: user.externalWalletAddress || null,
      walletType: user.walletType || 'custodial',
    };
  }

  async getRankings(): Promise<any[]> {
    const users = await this.userRepository.find({
      order: { totalXp: 'DESC' },
      take: 50,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      displayName: user.displayName || user.username,
      city: user.city || 'Ciudad de México',
      xp: user.totalXp,
      streak: user.currentStreak,
      character: user.character || 'chima',
    }));
  }
}
