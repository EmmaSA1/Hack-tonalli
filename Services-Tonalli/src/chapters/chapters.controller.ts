import {
  Controller, Get, Post, Patch, Put, Delete,
  Param, Body, UseGuards, Req, UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CacheKeys, CacheTTL as TTL } from '../config/redis.config';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  /** GET /api/chapters - returns published chapters filtered by user plan + week
   *  Cached for 5 minutes per the Redis caching strategy (M5-003)
   */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey(CacheKeys.CHAPTERS_LIST)
  @CacheTTL(TTL.CHAPTERS)
  @Get()
  findPublished(@Req() req: any) {
    return this.chaptersService.findPublishedForUser(req.user.id);
  }

  /** GET /api/chapters/admin/all - all chapters including unpublished */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  findAll() {
    return this.chaptersService.findAll();
  }

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

  /** PATCH /api/chapters/modules/:moduleId - admin update module
   *  Invalidates chapters cache on update
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('modules/:moduleId')
  updateModule(@Param('moduleId') moduleId: string, @Body() data: any) {
    return this.chaptersService.updateModule(moduleId, data);
  }

  /** GET /api/chapters/modules/:id/questions */
  @Get('modules/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getModuleQuestions(@Param('id') id: string) {
    return this.chaptersService.getModuleQuestions(id);
  }

  /** PUT /api/chapters/modules/:id/questions */
  @Put('modules/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  replaceModuleQuestions(@Param('id') id: string, @Body() body: { questions: any[] }) {
    return this.chaptersService.replaceModuleQuestions(id, body.questions);
  }

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

  /** POST /api/chapters - create chapter */
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

  /** PATCH /api/chapters/:id
   *  Invalidates chapters cache on update
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  /** PATCH /api/chapters/:id/publish
   *  Invalidates chapters cache on publish/unpublish
   */
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
