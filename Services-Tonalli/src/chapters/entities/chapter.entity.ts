import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChapterModule } from './chapter-module.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  moduleTag: string;   // e.g. "blockchain", "stellar", "defi"

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  published: boolean;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  estimatedMinutes: number;

  @Column({ default: 0 })
  xpReward: number;

  // Week this chapter is released for Free users (admin sets this)
  @Column({ nullable: true })
  releaseWeek: string; // e.g. "2026-W12"

  @OneToMany(() => ChapterModule, (m) => m.chapter, { cascade: true })
  modules: ChapterModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
