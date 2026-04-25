import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbType = (process.env.DB_TYPE || 'postgres') as
          | 'postgres'
          | 'mysql';
        const baseConfig = {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(
            process.env.DB_PORT || (dbType === 'postgres' ? '5432' : '3306'),
          ),
          username:
            process.env.DB_USER || (dbType === 'postgres' ? 'tonalli' : 'root'),
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
          logging: process.env.DB_LOGGING === 'true',
        };

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            ...baseConfig,
          };
        } else {
          return {
            type: 'mysql',
            ...baseConfig,
            charset: 'utf8mb4',
          };
        }
      },
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
  providers: [AppService],
})
export class AppModule {}
