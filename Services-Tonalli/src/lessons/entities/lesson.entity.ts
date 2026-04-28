import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { Progress } from '../../progress/entities/progress.entity';

export enum LessonType {
  VIDEO = 'video',
  READING = 'reading',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  moduleId: string;

  @Column()
  moduleName: string;

  @Column({ default: 0 })
  order: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: LessonType.READING,
  })
  type: LessonType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: 50 })
  xpReward: number;

  @Column({ type: 'varchar', length: 20, default: '0.5' })
  xlmReward: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  character: string;

  @Column({ nullable: true })
  characterDialogue: string;

  @OneToMany(() => Quiz, (quiz) => quiz.lesson)
  quizzes: Quiz[];

  @OneToMany(() => Progress, (progress) => progress.lesson)
  progress: Progress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
