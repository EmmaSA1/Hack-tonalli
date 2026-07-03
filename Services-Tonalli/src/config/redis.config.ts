import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

export const redisConfig: CacheModuleOptions = {
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  ttl: 300, // default 5 minutes
};

export const CacheTTL = {
  CHAPTERS: 300,      // 5 minutes
  LEADERBOARD: 120,   // 2 minutes
  CERTIFICATE: 600,   // 10 minutes
};

export const CacheKeys = {
  CHAPTERS_LIST: 'chapters:published',
  GLOBAL_LEADERBOARD: 'podium:global',
  WEEKLY_LEADERBOARD: 'podium:weekly',
  CERTIFICATE: (userId: string) => `certificate:${userId}`,
};
