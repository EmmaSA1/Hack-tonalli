import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Quiz } from './entities/quiz.entity';
import { Progress } from '../progress/entities/progress.entity';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function normalizeQuestionsPool(pool: unknown): QuizQuestion[] {
  if (Array.isArray(pool)) return pool as QuizQuestion[];
  if (typeof pool === 'string') return JSON.parse(pool) as QuizQuestion[];
  return [];
}

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
  ) {}

  async findAll(userId?: string): Promise<any[]> {
    const lessons = await this.lessonRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });

    if (!userId) return lessons;

    const userProgress = await this.progressRepository.find({
      where: { userId },
    });
    const progressMap = new Map(userProgress.map((p) => [p.lessonId, p]));

    return lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        moduleId: lesson.moduleId,
        moduleName: lesson.moduleName,
        order: lesson.order,
        type: lesson.type,
        xpReward: lesson.xpReward,
        xlmReward: lesson.xlmReward,
        character: lesson.character,
        characterDialogue: lesson.characterDialogue,
        completed: progress?.completed || false,
        score: progress?.score || 0,
        attempts: progress?.attempts || 0,
      };
    });
  }

  async findById(id: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    let content: any = null;
    try {
      content = lesson.content ? JSON.parse(lesson.content) : null;
    } catch {
      content = lesson.content;
    }

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      moduleId: lesson.moduleId,
      moduleName: lesson.moduleName,
      order: lesson.order,
      type: lesson.type,
      content,
      xpReward: lesson.xpReward,
      xlmReward: lesson.xlmReward,
      character: lesson.character,
      characterDialogue: lesson.characterDialogue,
    };
  }

  async getQuizQuestions(lessonId: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const quiz = await this.quizRepository.findOne({ where: { lessonId } });
    if (!quiz) throw new NotFoundException('Quiz not found for this lesson');

    const pool = normalizeQuestionsPool(quiz.questionsPool);

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, quiz.questionsPerAttempt);

    const questionsForClient = selected.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return {
      lessonId,
      lessonTitle: lesson.title,
      questions: questionsForClient,
      totalQuestions: questionsForClient.length,
      passingScore: quiz.passingScore,
    };
  }

  async validateQuizAnswers(
    lessonId: string,
    answers: { questionId: string; selectedIndex: number }[],
  ): Promise<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    results: any[];
  }> {
    const quiz = await this.quizRepository.findOne({ where: { lessonId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const pool = normalizeQuestionsPool(quiz.questionsPool);
    const questionMap = new Map(pool.map((q) => [q.id, q]));

    let correctCount = 0;
    const results = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) return { questionId: answer.questionId, correct: false };

      const isCorrect = question.correctIndex === answer.selectedIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: answer.questionId,
        correct: isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      };
    });

    const score =
      answers.length > 0
        ? Math.round((correctCount / answers.length) * 100)
        : 0;
    const passed = score >= quiz.passingScore;

    return {
      score,
      passed,
      correctCount,
      totalQuestions: answers.length,
      results,
    };
  }

  async getModules(): Promise<any[]> {
    const lessons = await this.lessonRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });

    const moduleMap = new Map<string, any>();
    lessons.forEach((lesson) => {
      if (!moduleMap.has(lesson.moduleId)) {
        moduleMap.set(lesson.moduleId, {
          id: lesson.moduleId,
          name: lesson.moduleName,
          lessons: [],
        });
      }
      moduleMap.get(lesson.moduleId).lessons.push({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        type: lesson.type,
      });
    });

    return Array.from(moduleMap.values());
  }
}
