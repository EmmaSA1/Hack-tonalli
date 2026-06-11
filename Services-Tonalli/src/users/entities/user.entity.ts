import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Progress } from '../../progress/entities/progress.entity';
import { NFTCertificate } from '../../progress/entities/nft-certificate.entity';
import { Streak } from './streak.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'user' })
  role: 'admin' | 'user' | 'designer';

  @Column({ nullable: true })
  stellarPublicKey: string;

  @Column({ nullable: true })
  stellarSecretKey: string;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 0 })
  totalXp: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ nullable: true })
  lastActivityDate: string;

  @Column({ default: false })
  isFunded: boolean;

  @Column({ nullable: true })
  externalWalletAddress: string;

  @Column({ default: 'custodial' })
  walletType: 'custodial' | 'external' | 'hybrid';

  @Column({ default: 'free' })
  plan: 'free' | 'pro' | 'max';

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCheckoutSessionId: string;

  @Column({ nullable: true })
  stripeSubscriptionStatus: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  character: string;

  @Column({ default: true })
  isFirstLogin: boolean;

  @Column({ nullable: true })
  companion: string;

  @Column({ nullable: true })
  avatarType: string;

  @OneToMany(() => Progress, (progress) => progress.user)
  progress: Progress[];

  @OneToMany(() => NFTCertificate, (cert) => cert.user)
  certificates: NFTCertificate[];

  @OneToMany(() => Streak, (streak) => streak.user)
  streaks: Streak[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
