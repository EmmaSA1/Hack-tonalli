import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('chapter_modules')
export class ChapterModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.modules, { onDelete: 'CASCADE' })
  chapter: Chapter;

  @Column()
  chapterId: string;

  // 'lesson' = modules 1-3 (has info + video + quiz)
  // 'final_exam' = module 4 (comprehensive quiz only)
  @Column()
  type: 'lesson' | 'final_exam';

  @Column()
  order: number; // 1-4

  @Column({ nullable: true })
  title: string;

  // ── Info section (for lesson modules) ────────────────────────────────────
  // JSON with { sections: [...], keyTerms: [...] }
  @Column({ type: 'text', nullable: true })
  content: string;

  // ── Video section (for lesson modules) ───────────────────────────────────
  @Column({ nullable: true })
  videoUrl: string;

  // ── Quiz section (for lesson modules AND final_exam) ─────────────────────
  // JSON array of questions
  @Column({ type: 'jsonb', nullable: true })
  questionsPool: Record<string, unknown>[] | null;

  @Column({ default: 5 })
  questionsPerAttempt: number;

  @Column({ default: 80 })
  passingScore: number;

  @Column({ default: 0 })
  xpReward: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
