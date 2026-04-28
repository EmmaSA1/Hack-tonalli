import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { NFTCertificate } from './entities/nft-certificate.entity';
import { UsersService } from '../users/users.service';
import { StellarService } from '../stellar/stellar.service';
import { SorobanService } from '../stellar/soroban.service';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../lessons/entities/quiz.entity';

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
  private readonly logger = new Logger(ProgressService.name);

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
    private readonly stellarService: StellarService,
    private readonly sorobanService: SorobanService,
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
    let xlmReward: { amount: string; txHash: string | undefined } | null = null;
    let nftCertificate: NFTCertificate | null = null;
    const wasAlreadyCompleted = progress.completed;

    if (passed && !wasAlreadyCompleted) {
      progress.completed = true;
      progress.completedAt = new Date();

      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
      });
      const user = await this.usersService.findById(userId);

      xpEarned = lesson?.xpReward || 50;
      await this.usersService.addXP(userId, xpEarned);
      await this.usersService.updateStreak(userId);

      // Send XLM reward from admin wallet (not user's secret key)
      if (user.stellarPublicKey && lesson?.xlmReward) {
        try {
          await this.stellarService.ensureAccountFunded(user.stellarPublicKey);

          const xlmResult = await this.stellarService.sendRewardFromAdmin(
            user.stellarPublicKey,
            lesson.xlmReward,
          );
          if (xlmResult.success) {
            xlmReward = { amount: lesson.xlmReward, txHash: xlmResult.txHash };
          }
        } catch (error) {
          this.logger.error(`XLM reward failed: ${error.message}`);
        }
      }

      // Mint TNL tokens as learning reward
      if (user.stellarPublicKey && lesson) {
        try {
          const tnlAmount = (lesson.xpReward || 50) / 10; // 1 TNL per 10 XP
          await this.sorobanService.mintTokens(
            user.stellarPublicKey,
            tnlAmount,
          );
        } catch (error) {
          this.logger.error(`TNL mint failed: ${error.message}`);
        }
      }

      // Mint NFT certificate from admin wallet (no user secret key needed)
      if (user.stellarPublicKey && lesson) {
        try {
          const nftResult = await this.stellarService.mintNFTFromAdmin(
            user.stellarPublicKey,
            lesson.title,
            lessonId,
          );

          const cert = this.nftRepository.create({
            userId,
            lessonId,
            txHash: nftResult.txHash,
            assetCode: nftResult.assetCode,
            issuerPublicKey: nftResult.issuerPublicKey || user.stellarPublicKey,
            status: nftResult.success ? 'minted' : 'simulated',
          });
          nftCertificate = await this.nftRepository.save(cert);
        } catch (error) {
          this.logger.error(`NFT mint failed: ${error.message}`);
        }
      }
    }

    progress.xpEarned = Math.max(progress.xpEarned || 0, xpEarned);
    await this.progressRepository.save(progress);

    return {
      score,
      passed,
      correctCount,
      totalQuestions: answers.length,
      results,
      xpEarned,
      xlmReward,
      nftCertificate: nftCertificate
        ? {
            id: nftCertificate.id,
            txHash: nftCertificate.txHash,
            assetCode: nftCertificate.assetCode,
            status: nftCertificate.status,
          }
        : null,
      alreadyCompleted: wasAlreadyCompleted,
      message: passed
        ? wasAlreadyCompleted
          ? '¡Ya completaste esta lección! Buen repaso.'
          : '¡Felicidades! Has completado la lección y ganado tu NFT.'
        : `¡Sigue intentando! Necesitas ${quiz.passingScore}% para pasar. Obtuviste ${score}%.`,
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
