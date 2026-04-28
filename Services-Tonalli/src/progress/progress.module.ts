import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Progress } from './entities/progress.entity';
import { NFTCertificate } from './entities/nft-certificate.entity';
import { UsersModule } from '../users/users.module';
import { StellarModule } from '../stellar/stellar.module';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../lessons/entities/quiz.entity';
import { QuizRewardsProcessor } from './quiz-rewards.processor';
import { REWARDS_QUEUE } from './constants/rewards-queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Progress, NFTCertificate, Lesson, Quiz]),
    BullModule.registerQueue({ name: REWARDS_QUEUE }),
    UsersModule,
    StellarModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, QuizRewardsProcessor],
  exports: [ProgressService],
})
export class ProgressModule {}
