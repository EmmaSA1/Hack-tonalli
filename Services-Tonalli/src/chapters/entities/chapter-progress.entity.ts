import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chapter } from './chapter.entity';
import { ChapterModule } from './chapter-module.entity';

@Entity('chapter_progress')
export class ChapterProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @Column()
  chapterId: string;

  @ManyToOne(() => ChapterModule)
  module: ChapterModule;

  @Column()
  moduleId: string;

  // ── Section progress (for lesson modules) ────────────────────────────────
  @Column({ default: false })
  infoCompleted: boolean;

  @Column({ default: 0 })
  videoProgress: number; // 0-100

  @Column({ default: false })
  videoCompleted: boolean;

  @Column({ default: false })
  quizCompleted: boolean;

  @Column({ default: 0 })
  quizScore: number;

  @Column({ default: 0 })
  quizAttempts: number;

  // ── Overall module completion (all 3 sections done, or final exam passed) ─
  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  rewardSent: boolean;

  @Column({ default: 0 })
  score: number; // best quiz score

  @Column({ default: 0 })
  attempts: number; // total quiz attempts (for lives)

  // For lives system
  @Column({ nullable: true })
  lockedUntil: Date;

  @Column({ default: 0 })
  xpEarned: number;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
