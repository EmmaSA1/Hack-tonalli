import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as StellarSdk from '@stellar/stellar-sdk';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
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
    // Validate Stellar address format
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
    const user = await this.findById(userId);

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    if (!user.stellarSecretKey) {
      throw new NotFoundException('No custodial wallet found');
    }

    return { secretKey: user.stellarSecretKey };
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

  async adminGetUsers(): Promise<any[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      xp: user.xp,
      totalXp: user.totalXp,
      streak: user.currentStreak,
      plan: user.plan || 'free',
      character: user.character || 'chima',
    }));
  }

  async adminGetMetrics(): Promise<{ totalQuizzes: number; totalXlmDistributed: number }> {
    // Total XLM distributed: sum of totalXp / 100
    const { sumXp } = await this.userRepository
      .createQueryBuilder('user')
      .select('SUM(user.totalXp)', 'sumXp')
      .getRawOne();
    
    // Total Quizzes: count of chapter_progress where completed = true or quizCompleted = true
    const progressCount = await this.userRepository.query(
      `SELECT COUNT(*) as count FROM chapter_progress WHERE "completed" = 1 OR "quizCompleted" = 1`
    );

    return {
      totalQuizzes: parseInt(progressCount[0].count, 10) || 0,
      totalXlmDistributed: Math.floor((parseInt(sumXp, 10) || 0) / 100),
    };
  }
}
