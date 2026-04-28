import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { StellarModule } from '../stellar/stellar.module';
import { SecretsService } from '../secrets/secrets.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [SecretsService],
      useFactory: (secrets: SecretsService) => ({
        secret: secrets.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    UsersModule,
    StellarModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
