import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  async getUserProgress(@Req() req) {
    return this.progressService.getUserProgress(req.user.id);
  }

  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  async getCertificates(@Req() req) {
    return this.progressService.getUserCertificates(req.user.id);
  }

  @Get('progress/rewards/:lessonId/status')
  @UseGuards(JwtAuthGuard)
  async getRewardStatus(@Req() req, @Param('lessonId') lessonId: string) {
    return this.progressService.getQuizRewardStatus(req.user.id, lessonId);
  }
}
