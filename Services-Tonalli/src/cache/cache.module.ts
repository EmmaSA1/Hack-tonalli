import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        
        if (!redisUrl) {
          console.warn('[CacheModule] REDIS_URL not configured - using in-memory cache');
          return { ttl: 300000 };
        }

        return {
          store: await redisStore({
            url: redisUrl,
           ttl: 300000,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class TonalliCacheModule {}