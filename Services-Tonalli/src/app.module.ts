import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LessonsModule } from './lessons/lessons.module';
import { StellarModule } from './stellar/stellar.module';
import { ProgressModule } from './progress/progress.module';
import { ChaptersModule } from './chapters/chapters.module';
import { PodiumModule } from './podium/podium.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ActaModule } from './acta/acta.module';
import { Chapter } from './chapters/entities/chapter.entity';
import { ChapterModule as ChapterModuleEntity } from './chapters/entities/chapter-module.entity';
import { ChapterProgress } from './chapters/entities/chapter-progress.entity';
import { ChapterQuestion } from './chapters/entities/chapter-question.entity';
import { WeeklyScore } from './podium/entities/weekly-score.entity';
import { PodiumReward } from './podium/entities/podium-reward.entity';
import { ActaCertificate } from './certificates/entities/acta-certificate.entity';
import { User } from './users/entities/user.entity';
import { Lesson } from './lessons/entities/lesson.entity';
import { Quiz } from './lessons/entities/quiz.entity';
import { Progress } from './progress/entities/progress.entity';
import { NFTCertificate } from './progress/entities/nft-certificate.entity';
import { Streak } from './users/entities/streak.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'login',
        ttl: 900000,
        limit: 5,
      },
      {
        name: 'quiz',
        ttl: 60000,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'tonalli',
        entities: [
          User,
          Lesson,
          Quiz,
          Progress,
          NFTCertificate,
          Streak,
          Chapter,
          ChapterModuleEntity,
          ChapterProgress,
          ChapterQuestion,
          WeeklyScore,
          PodiumReward,
          ActaCertificate,
        ],
        synchronize: true, // crea/actualiza tablas automáticamente
        logging: false,
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    UsersModule,
    LessonsModule,
    StellarModule,
    ProgressModule,
    ChaptersModule,
    PodiumModule,
    CertificatesModule,
    ActaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
