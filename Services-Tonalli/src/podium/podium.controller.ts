import {
  Controller, Get, Post, Patch, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { PodiumService } from './podium.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('podium')
export class PodiumController {
  constructor(private readonly podiumService: PodiumService) {}

  /** GET /api/podium/weekly — Premium weekly leaderboard */
  @UseGuards(JwtAuthGuard)
  @Get('weekly')
  getWeeklyLeaderboard(@Req() req: any) {
    return this.podiumService.getWeeklyLeaderboard(req.user.id);
  }

  /** GET /api/podium/nfts — User's podium NFT trophies */
  @UseGuards(JwtAuthGuard)
  @Get('nfts')
  getUserPodiumNfts(@Req() req: any) {
    return this.podiumService.getUserPodiumNfts(req.user.id);
  }

  /** GET /api/podium/global — All-time leaderboard for everyone */
  @UseGuards(JwtAuthGuard)
  @Get('global')
  getGlobalLeaderboard() {
    return this.podiumService.getGlobalLeaderboard();
  }

  /** GET /api/podium/city?city=CDMX — City leaderboard */
  @UseGuards(JwtAuthGuard)
  @Get('city')
  getCityLeaderboard(@Query('city') city: string) {
    return this.podiumService.getCityLeaderboard(city);
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  /** POST /api/podium/distribute — Distribute weekly rewards */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('distribute')
  distributeRewards() {
    return this.podiumService.distributeWeeklyRewards();
  }

  /** POST /api/podium/demo-distribute — Demo: simulate podium distribution (no admin required) */
  @UseGuards(JwtAuthGuard)
  @Post('demo-distribute')
  demoDistribute(@Req() req: any) {
    return this.podiumService.demoDistributeRewards(req.user.id);
  }

  /** PATCH /api/podium/pause — Pause rewards (circuit breaker) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('pause')
  pauseRewards() {
    this.podiumService.pauseRewards();
    return { paused: true };
  }

  /** PATCH /api/podium/resume — Resume rewards */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('resume')
  resumeRewards() {
    this.podiumService.resumeRewards();
    return { paused: false };
  }
}
