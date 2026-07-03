import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKeys } from '../config/redis.config';

@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async invalidateChaptersCache(): Promise<void> {
    await this.cacheManager.del(CacheKeys.CHAPTERS_LIST);
  }

  async invalidateLeaderboardCache(): Promise<void> {
    await this.cacheManager.del(CacheKeys.GLOBAL_LEADERBOARD);
    await this.cacheManager.del(CacheKeys.WEEKLY_LEADERBOARD);
  }

  async invalidateCertificateCache(userId: string): Promise<void> {
    await this.cacheManager.del(CacheKeys.CERTIFICATE(userId));
  }

  async invalidateAll(): Promise<void> {
    await this.cacheManager.clear();
  }
}
