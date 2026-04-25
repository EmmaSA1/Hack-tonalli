import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  CERTIFICATE_ISSUED = 'certificate_issued',
  REWARD_PROCESSED = 'reward_processed',
  STREAK_LOST = 'streak_lost',
  STREAK_MILESTONE = 'streak_milestone',
  LEVEL_UP = 'level_up',
  PODIUM_REWARD = 'podium_reward',
  LESSON_COMPLETED = 'lesson_completed',
  CHAPTER_COMPLETED = 'chapter_completed',
}

@Entity('notifications')
@Index(['userId', 'read'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
