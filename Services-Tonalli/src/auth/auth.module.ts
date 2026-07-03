import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AuthScheduler } from './auth.scheduler';
import { UsersModule } from '../users/users.module';
import { StellarModule } from '../stellar/stellar.module';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tonalli_secret_2026',
      signOptions: { expiresIn: '15m' }, // Default for access tokens
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    UsersModule,
    StellarModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthScheduler],
  exports: [AuthService],
})
export class AuthModule {}
