import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { UsersService } from '../users/users.service';
import { SorobanService } from '../stellar/soroban.service';
import { StellarService } from '../stellar/stellar.service';
import { NFTCertificate } from './entities/nft-certificate.entity';
import {
  PROCESS_QUIZ_REWARDS_JOB,
  REWARDS_QUEUE,
} from './constants/rewards-queue.constants';

interface QuizRewardsJobData {
  userId: string;
  lessonId: string;
  progressId: string;
  score: number;
  xpEarned: number;
}

@Processor(REWARDS_QUEUE)
export class QuizRewardsProcessor {
  private readonly logger = new Logger(QuizRewardsProcessor.name);

  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(NFTCertificate)
    private readonly nftRepository: Repository<NFTCertificate>,
    private readonly usersService: UsersService,
    private readonly sorobanService: SorobanService,
    private readonly stellarService: StellarService,
  ) {}

  @Process(PROCESS_QUIZ_REWARDS_JOB)
  async processQuizRewards(job: Job<QuizRewardsJobData>): Promise<void> {
    const { userId, lessonId, progressId, score, xpEarned } = job.data;
    const progress = await this.progressRepository.findOne({
      where: { id: progressId, userId, lessonId },
    });
    if (!progress) return;

    progress.rewardsStatus = 'processing';
    progress.rewardsRetryCount = job.attemptsMade;
    await this.progressRepository.save(progress);

    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
    const user = await this.usersService.findById(userId);
    if (!lesson || !user.stellarPublicKey) {
      throw new Error('Missing lesson or user wallet for rewards processing');
    }

    await this.stellarService.ensureAccountFunded(user.stellarPublicKey);

    const xlmAmount = parseFloat(lesson.xlmReward || '0');
    if (xlmAmount > 0) {
      const xlmReward = await this.sorobanService.rewardUser({
        userPublicKey: user.stellarPublicKey,
        lessonId,
        amountXlm: xlmAmount,
        score,
      });
      progress.rewardXlmAmount = xlmReward.amountXlm.toString();
      progress.rewardXlmTxHash = xlmReward.txHash;
    }

    const tnlAmount = (xpEarned || lesson.xpReward || 50) / 10;
    await this.sorobanService.mintTokens(user.stellarPublicKey, tnlAmount);

    const certificateResult = await this.sorobanService.mintCertificate({
      userPublicKey: user.stellarPublicKey,
      lessonId,
      moduleId: lesson.moduleId || 'legacy-module',
      username: user.username,
      score,
      xpEarned,
    });

    const cert = this.nftRepository.create({
      userId,
      lessonId,
      txHash: certificateResult.txHash,
      assetCode: `SORO_CERT_${certificateResult.tokenId}`,
      issuerPublicKey: user.stellarPublicKey,
      status: 'minted',
    });
    await this.nftRepository.save(cert);

    progress.rewardsStatus = 'completed';
    progress.rewardsError = null;
    progress.rewardsProcessedAt = new Date();
    await this.progressRepository.save(progress);
  }

  @OnQueueFailed()
  async onJobFailed(job: Job<QuizRewardsJobData>, error: Error): Promise<void> {
    const progress = await this.progressRepository.findOne({
      where: { id: job.data.progressId },
    });
    if (!progress) return;

    progress.rewardsRetryCount = job.attemptsMade;
    if (job.attemptsMade >= 3) {
      progress.rewardsStatus = 'failed';
      progress.rewardsError = error.message;
      this.logger.error(
        `ALERT_ADMIN rewards job failed permanently for user=${job.data.userId} lesson=${job.data.lessonId}: ${error.message}`,
      );
    }

    await this.progressRepository.save(progress);
  }
}
