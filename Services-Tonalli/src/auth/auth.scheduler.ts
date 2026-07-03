import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

@Injectable()
export class AuthScheduler {
  private readonly logger = new Logger(AuthScheduler.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Clean up expired refresh tokens daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredTokenCleanup() {
    this.logger.log('Running expired refresh token cleanup...');
    try {
      await this.authService.cleanupExpiredTokens();
      this.logger.log('Expired refresh tokens cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to clean up expired tokens', error);
    }
  }
}
