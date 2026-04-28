import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChapterModule } from './chapter-module.entity';

@Entity('chapter_questions')
export class ChapterQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  moduleId: string;

  @ManyToOne(() => ChapterModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: ChapterModule;

  @Column('text')
  question: string;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column()
  correctIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ default: 0 })
  order: number;
}
