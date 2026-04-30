import {
  Controller, Get, Post, Patch, Query,
  UseGuards, Req, UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { PodiumService } from './podium.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CacheKeys, CacheTTL as TTL } from '../config/redis.config';

@Controller('podium')
export class PodiumController {
  constructor(private readonly podiumService: PodiumService) {}

  /** GET /api/podium/weekly - Premium weekly leaderboard
   *  Cached for 2 minutes per the Redis caching strategy (M5-003)
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey(CacheKeys.WEEKLY_LEADERBOARD)
  @CacheTTL(TTL.LEADERBOARD)
  @Get('weekly')
  getWeeklyLeaderboard(@Req() req: any) {
    return this.podiumService.getWeeklyLeaderboard(req.user.id);
  }

  /** GET /api/podium/nfts - User podium NFT trophies */
  @UseGuards(JwtAuthGuard)
  @Get('nfts')
  getUserPodiumNfts(@Req() req: any) {
    return this.podiumService.getUserPodiumNfts(req.user.id);
  }

  /** GET /api/podium/global - All-time leaderboard
   *  Cached for 2 minutes per the Redis caching strategy (M5-003)
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey(CacheKeys.GLOBAL_LEADERBOARD)
  @CacheTTL(TTL.LEADERBOARD)
  @Get('global')
  getGlobalLeaderboard() {
    return this.podiumService.getGlobalLeaderboard();
  }

  /** GET /api/podium/city?city=CDMX - City leaderboard */
  @UseGuards(JwtAuthGuard)
  @Get('city')
  getCityLeaderboard(@Query('city') city: string) {
    return this.podiumService.getCityLeaderboard(city);
  }

  /** POST /api/podium/distribute - Distribute weekly rewards
   *  Invalidates leaderboard cache after distribution
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('distribute')
  distributeRewards() {
    return this.podiumService.distributeWeeklyRewards();
  }

  /** POST /api/podium/demo-distribute */
  @UseGuards(JwtAuthGuard)
  @Post('demo-distribute')
  demoDistribute(@Req() req: any) {
    return this.podiumService.demoDistributeRewards(req.user.id);
  }

  /** PATCH /api/podium/pause */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('pause')
  pauseRewards() {
    this.podiumService.pauseRewards();
    return { paused: true };
  }

  /** PATCH /api/podium/resume */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('resume')
  resumeRewards() {
    this.podiumService.resumeRewards();
    return { paused: false };
  }
}
