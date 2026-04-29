import {
  Controller, Get, Post, Patch, Put, Delete,
  Param, Body, UseGuards, Req, UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  CACHE_CHAPTERS_LIST,
  CACHE_CHAPTERS_TTL,
} from '../cache/cache.constants';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  // ── Static/specific routes FIRST (before :id param routes) ───────────────

  /** GET /api/chapters — returns published chapters filtered by user plan + week */
  @UseGuards(JwtAuthGuard)
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_CHAPTERS_TTL / 1000)
  findPublished(@Req() req: any) {
    return this.chaptersService.findPublishedForUser(req.user.id);
  }

  /** GET /api/chapters/admin/all — all chapters including unpublished */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  findAll() {
    return this.chaptersService.findAll();
  }

  // ── Module routes (must be before :id to avoid conflict) ─────────────────

  /** GET /api/chapters/modules/:moduleId/content */
  @UseGuards(JwtAuthGuard)
  @Get('modules/:moduleId/content')
  getModuleContent(@Param('moduleId') moduleId: string) {
    return this.chaptersService.getModuleContent(moduleId);
  }

  /** GET /api/chapters/modules/:moduleId/quiz */
  @UseGuards(JwtAuthGuard)
  @Get('modules/:moduleId/quiz')
  getQuizQuestions(@Param('moduleId') moduleId: string, @Req() req: any) {
    return this.chaptersService.getQuizQuestions(moduleId, req.user.id);
  }

  /** POST /api/chapters/modules/:moduleId/complete-info */
  @UseGuards(JwtAuthGuard)
  @Post('modules/:moduleId/complete-info')
  completeInfoModule(@Param('moduleId') moduleId: string, @Req() req: any) {
    return this.chaptersService.completeInfoModule(moduleId, req.user.id);
  }

  /** POST /api/chapters/modules/:moduleId/video-progress */
  @UseGuards(JwtAuthGuard)
  @Post('modules/:moduleId/video-progress')
  updateVideoProgress(
    @Param('moduleId') moduleId: string,
    @Body('percent') percent: number,
    @Req() req: any,
  ) {
    return this.chaptersService.updateVideoProgress(moduleId, req.user.id, percent);
  }

  /** POST /api/chapters/modules/:moduleId/quiz/submit */
  @UseGuards(JwtAuthGuard)
  @Post('modules/:moduleId/quiz/submit')
  submitQuiz(
    @Param('moduleId') moduleId: string,
    @Body('answers') answers: { questionId: string; selectedIndex: number }[],
    @Req() req: any,
  ) {
    return this.chaptersService.submitQuiz(moduleId, req.user.id, answers);
  }

  /** POST /api/chapters/modules/:moduleId/quiz/abandon */
  @UseGuards(JwtAuthGuard)
  @Post('modules/:moduleId/quiz/abandon')
  reportQuizAbandon(
    @Param('moduleId') moduleId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.chaptersService.reportQuizAbandon(moduleId, req.user.id, reason || 'tab_switch');
  }

  /** PATCH /api/chapters/modules/:moduleId — admin update module */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('modules/:moduleId')
  updateModule(@Param('moduleId') moduleId: string, @Body() data: any) {
    return this.chaptersService.updateModule(moduleId, data);
  }

  /** GET /api/chapters/modules/:id/questions — admin get module questions */
  @Get('modules/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getModuleQuestions(@Param('id') id: string) {
    return this.chaptersService.getModuleQuestions(id);
  }

  /** PUT /api/chapters/modules/:id/questions — admin replace module questions */
  @Put('modules/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  replaceModuleQuestions(@Param('id') id: string, @Body() body: { questions: any[] }) {
    return this.chaptersService.replaceModuleQuestions(id, body.questions);
  }

  // ── Param :id routes (AFTER static routes) ───────────────────────────────

  /** GET /api/chapters/:id */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id);
  }

  /** GET /api/chapters/:id/progress */
  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  getChapterWithProgress(@Param('id') id: string, @Req() req: any) {
    return this.chaptersService.getChapterWithProgress(id, req.user.id);
  }

  /** POST /api/chapters — create chapter */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }

  /** POST /api/chapters/:id/unlock-exam */
  @UseGuards(JwtAuthGuard)
  @Post(':id/unlock-exam')
  unlockFinalExam(@Param('id') id: string, @Req() req: any) {
    return this.chaptersService.unlockFinalExam(id, req.user.id);
  }

  /** PATCH /api/chapters/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  /** PATCH /api/chapters/:id/publish */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.chaptersService.togglePublish(id);
  }

  /** PATCH /api/chapters/:id/release */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/release')
  releaseThisWeek(@Param('id') id: string) {
    return this.chaptersService.releaseThisWeek(id);
  }

  /** PATCH /api/chapters/:id/release-week */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/release-week')
  setReleaseWeek(@Param('id') id: string, @Body('week') week: string) {
    return this.chaptersService.setReleaseWeek(id, week);
  }

  /** DELETE /api/chapters/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }
}
