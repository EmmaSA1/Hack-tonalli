import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { StellarModule } from '../stellar/stellar.module';
import { VaultService } from '../vault/vault.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    PassportModule,
    // JWT secret is fetched from Vault on startup, never from a plain env var
    JwtModule.registerAsync({
      useFactory: async (vaultService: VaultService) => ({
        secret: await vaultService.getSecret('tonalli/jwt-secret', 'value', 'JwtModule'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [VaultService],
    }),
    UsersModule,
    StellarModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Factory provider so JwtStrategy receives the secret from Vault, not process.env
    {
      provide: JwtStrategy,
      useFactory: async (vaultService: VaultService, usersService: UsersService) => {
        const jwtSecret = await vaultService.getSecret('tonalli/jwt-secret', 'value', 'JwtStrategy');
        return new JwtStrategy(jwtSecret, usersService);
      },
      inject: [VaultService, UsersService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
