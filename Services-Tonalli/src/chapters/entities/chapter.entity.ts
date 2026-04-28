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

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ nullable: true })
  moduleTag: string;

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

  @Column({ nullable: true })
  releaseWeek: string;

  @Column({ default: 'free' })
  requiredPlan: 'free' | 'pro' | 'max';

  @OneToMany(() => ChapterModule, (m) => m.chapter, { cascade: true })
  modules: ChapterModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
