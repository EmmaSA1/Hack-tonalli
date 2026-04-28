import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Progress } from './entities/progress.entity';
import { NFTCertificate } from './entities/nft-certificate.entity';
import { UsersService } from '../users/users.service';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../lessons/entities/quiz.entity';
import {
  PROCESS_QUIZ_REWARDS_JOB,
  REWARDS_QUEUE,
} from './constants/rewards-queue.constants';

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
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(NFTCertificate)
    private readonly nftRepository: Repository<NFTCertificate>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly usersService: UsersService,
    @InjectQueue(REWARDS_QUEUE)
    private readonly rewardsQueue: Queue,
  ) {}

  async submitQuiz(
    userId: string,
    lessonId: string,
    answers: { questionId: string; selectedIndex: number }[],
  ): Promise<any> {
    const quiz = await this.quizRepository.findOne({ where: { lessonId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const pool = normalizeQuestionsPool(quiz.questionsPool);
    const questionMap = new Map(pool.map((q) => [q.id, q]));

    let correctCount = 0;
    const results = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question)
        return { questionId: answer.questionId, correct: false };

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

    let progress = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    if (!progress) {
      progress = this.progressRepository.create({ userId, lessonId });
      progress.xpEarned = 0;
      progress.attempts = 0;
      progress.score = 0;
    }

    progress.attempts += 1;
    progress.score = Math.max(progress.score, score);

    let xpEarned = 0;
    let queuedJobId: string | null = null;
    const wasAlreadyCompleted = progress.completed;

    if (passed && !wasAlreadyCompleted) {
      progress.completed = true;
      progress.completedAt = new Date();

      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
      });
      xpEarned = lesson?.xpReward || 50;
      await this.usersService.addXP(userId, xpEarned);
      await this.usersService.updateStreak(userId);
      progress.rewardsStatus = 'queued';
      progress.rewardsRetryCount = 0;
      progress.rewardsError = null;
      progress.rewardXlmAmount = null;
      progress.rewardXlmTxHash = null;
      progress.rewardsProcessedAt = null;
    }

    progress.xpEarned = Math.max(progress.xpEarned || 0, xpEarned);
    const savedProgress = await this.progressRepository.save(progress);

    if (passed && !wasAlreadyCompleted) {
      const queuedJob = await this.rewardsQueue.add(
        PROCESS_QUIZ_REWARDS_JOB,
        {
          userId,
          lessonId,
          progressId: savedProgress.id,
          score,
          xpEarned,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
      queuedJobId = queuedJob.id ? String(queuedJob.id) : null;
      savedProgress.rewardsJobId = queuedJobId;
      await this.progressRepository.save(savedProgress);
    }

    return {
      score,
      passed,
      correctCount,
      totalQuestions: answers.length,
      results,
      xpEarned,
      xlmReward: null,
      nftCertificate: null,
      rewardsStatus: savedProgress.rewardsStatus,
      rewardsRetryCount: savedProgress.rewardsRetryCount,
      rewardsJobId: savedProgress.rewardsJobId || queuedJobId,
      alreadyCompleted: wasAlreadyCompleted,
      message: passed
        ? wasAlreadyCompleted
          ? '¡Ya completaste esta lección! Buen repaso.'
          : '¡Felicidades! Has completado la lección y ganado tu NFT.'
        : `¡Sigue intentando! Necesitas ${quiz.passingScore}% para pasar. Obtuviste ${score}%.`,
    };
  }

  async getQuizRewardStatus(userId: string, lessonId: string): Promise<any> {
    const progress = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });
    if (!progress) throw new NotFoundException('Quiz progress not found');

    const nftCertificate = await this.nftRepository.findOne({
      where: { userId, lessonId },
      order: { issuedAt: 'DESC' },
    });

    return {
      lessonId,
      rewardsStatus: progress.rewardsStatus,
      rewardsRetryCount: progress.rewardsRetryCount,
      rewardsJobId: progress.rewardsJobId,
      rewardsError: progress.rewardsError,
      rewardsProcessedAt: progress.rewardsProcessedAt,
      xlmReward: progress.rewardXlmAmount
        ? {
            amount: progress.rewardXlmAmount,
            txHash: progress.rewardXlmTxHash || undefined,
          }
        : null,
      nftCertificate: nftCertificate
        ? {
            id: nftCertificate.id,
            txHash: nftCertificate.txHash,
            assetCode: nftCertificate.assetCode,
            status: nftCertificate.status,
          }
        : null,
    };
  }

  async getUserProgress(userId: string): Promise<any[]> {
    const progresses = await this.progressRepository.find({
      where: { userId },
      relations: ['lesson'],
    });

    return progresses.map((p) => ({
      id: p.id,
      lessonId: p.lessonId,
      lessonTitle: p.lesson?.title,
      completed: p.completed,
      score: p.score,
      attempts: p.attempts,
      xpEarned: p.xpEarned,
      completedAt: p.completedAt,
    }));
  }

  async getUserCertificates(userId: string): Promise<any[]> {
    const certs = await this.nftRepository.find({
      where: { userId },
      relations: ['lesson'],
      order: { issuedAt: 'DESC' },
    });

    return certs.map((cert) => ({
      id: cert.id,
      lessonTitle: cert.lesson?.title || 'Lección completada',
      txHash: cert.txHash,
      assetCode: cert.assetCode,
      issuerPublicKey: cert.issuerPublicKey,
      status: cert.status,
      issuedAt: cert.issuedAt,
      stellarExplorerUrl: cert.txHash
        ? `https://stellar.expert/explorer/testnet/tx/${cert.txHash}`
        : null,
    }));
  }
}
