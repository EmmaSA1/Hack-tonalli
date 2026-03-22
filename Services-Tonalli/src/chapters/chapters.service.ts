import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { ChapterModule } from './entities/chapter-module.entity';
import { ChapterProgress } from './entities/chapter-progress.entity';
import { ChapterQuestion } from './entities/chapter-question.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { User } from '../users/entities/user.entity';
import { SorobanService } from '../stellar/soroban.service';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chaptersRepo: Repository<Chapter>,
    @InjectRepository(ChapterModule)
    private readonly modulesRepo: Repository<ChapterModule>,
    @InjectRepository(ChapterProgress)
    private readonly progressRepo: Repository<ChapterProgress>,
    @InjectRepository(ChapterQuestion)
    private readonly questionsRepo: Repository<ChapterQuestion>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly sorobanService: SorobanService,
  ) {}

  // ── Admin CRUD ───────────────────────────────────────────────────────────

  async create(dto: CreateChapterDto): Promise<Chapter> {
    const chapter = this.chaptersRepo.create(dto);
    const saved = await this.chaptersRepo.save(chapter);

    // Auto-create 4 modules: 3 lesson modules + 1 final exam
    const modules = [
      { type: 'lesson' as const, order: 1, title: 'Módulo 1', questionsPerAttempt: 5, xpReward: 30 },
      { type: 'lesson' as const, order: 2, title: 'Módulo 2', questionsPerAttempt: 5, xpReward: 30 },
      { type: 'lesson' as const, order: 3, title: 'Módulo 3', questionsPerAttempt: 5, xpReward: 30 },
      { type: 'final_exam' as const, order: 4, title: 'Examen Final', questionsPerAttempt: 20, xpReward: 50 },
    ];

    for (const m of modules) {
      await this.modulesRepo.save(this.modulesRepo.create({
        chapterId: saved.id,
        type: m.type,
        order: m.order,
        title: m.title,
        passingScore: 80,
        questionsPerAttempt: m.questionsPerAttempt,
        xpReward: m.xpReward,
      }));
    }

    return this.findOne(saved.id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getCurrentWeek(): string {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  getNextWeek(): string {
    const now = new Date();
    const next = new Date(now.getTime() + 7 * 86400000);
    const jan1 = new Date(next.getFullYear(), 0, 1);
    const days = Math.floor((next.getTime() - jan1.getTime()) / 86400000);
    const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${next.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  // ── Find methods ────────────────────────────────────────────────────────

  async findAll(): Promise<Chapter[]> {
    return this.chaptersRepo.find({ relations: ['modules'], order: { order: 'ASC' } });
  }

  /** Admin: all published (no week filter) */
  async findAllPublished(): Promise<Chapter[]> {
    return this.chaptersRepo.find({ where: { published: true }, relations: ['modules'], order: { order: 'ASC' } });
  }

  /** User: published chapters filtered by plan */
  async findPublishedForUser(userId: string): Promise<any[]> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const userPlan = user?.plan || 'free';
    const allPublished = await this.chaptersRepo.find({
      where: { published: true },
      relations: ['modules'],
      order: { order: 'ASC' },
    });

    const currentWeek = this.getCurrentWeek();

    return allPublished.map((ch, index) => {
      let accessible = true;
      let reason = '';

      if (userPlan === 'free') {
        // Free: only first 3 chapters
        if (index >= 3) {
          accessible = false;
          reason = 'free_limit';
        }
      }
      // Pro and Max: all chapters accessible

      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        moduleTag: ch.moduleTag,
        order: ch.order,
        published: ch.published,
        coverImage: ch.coverImage,
        estimatedMinutes: ch.estimatedMinutes,
        xpReward: ch.xpReward,
        releaseWeek: ch.releaseWeek,
        modules: ch.modules?.sort((a, b) => a.order - b.order),
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
        // Access control
        accessible,
        lockedReason: accessible ? null : reason,
        currentWeek,
      };
    });
  }

  async findOne(id: string): Promise<Chapter> {
    // Try by UUID first, then by moduleTag (for friendly URLs)
    let ch = await this.chaptersRepo.findOne({ where: { id }, relations: ['modules'] });
    if (!ch) ch = await this.chaptersRepo.findOne({ where: { moduleTag: id }, relations: ['modules'] });
    if (!ch) throw new NotFoundException(`Chapter ${id} not found`);
    if (ch.modules) ch.modules.sort((a, b) => a.order - b.order);
    return ch;
  }

  async update(id: string, dto: UpdateChapterDto): Promise<Chapter> {
    const ch = await this.findOne(id);
    Object.assign(ch, dto);
    return this.chaptersRepo.save(ch);
  }

  async remove(id: string): Promise<void> {
    await this.chaptersRepo.remove(await this.findOne(id));
  }

  async togglePublish(id: string): Promise<Chapter> {
    const ch = await this.findOne(id);
    ch.published = !ch.published;
    return this.chaptersRepo.save(ch);
  }

  /** Admin: set releaseWeek for a chapter (release it for a specific week) */
  async setReleaseWeek(id: string, week: string): Promise<Chapter> {
    const ch = await this.findOne(id);
    ch.releaseWeek = week;
    return this.chaptersRepo.save(ch);
  }

  /** Admin: release chapter for the current week */
  async releaseThisWeek(id: string): Promise<Chapter> {
    return this.setReleaseWeek(id, this.getCurrentWeek());
  }

  async updateModule(moduleId: string, data: Partial<ChapterModule>): Promise<ChapterModule> {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    Object.assign(mod, data);
    return this.modulesRepo.save(mod);
  }

  async getModuleQuestions(moduleId: string) {
    return this.questionsRepo.find({ where: { moduleId }, order: { order: 'ASC' } });
  }

  async replaceModuleQuestions(moduleId: string, questions: { question: string; options: string[]; correctIndex: number; explanation: string }[]) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    // Delete existing
    await this.questionsRepo.delete({ moduleId });
    // Insert new
    for (const [idx, q] of questions.entries()) {
      await this.questionsRepo.save(this.questionsRepo.create({
        moduleId,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        order: idx,
      }));
    }
    return { success: true, count: questions.length };
  }

  // ── User: chapter with progress ─────────────────────────────────────────

  async getChapterWithProgress(chapterId: string, userId: string) {
    const chapter = await this.findOne(chapterId);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const userPlan = user?.plan || 'free';
    // Check plan-based access
    let chapterAccessible = true;
    let lockedReason: string | null = null;
    if (userPlan === 'free') {
      // Free users: only first 3 chapters (by order)
      const allPublished = await this.chaptersRepo.find({
        where: { published: true },
        order: { order: 'ASC' },
      });
      const chapterIndex = allPublished.findIndex(ch => ch.id === chapter.id);
      if (chapterIndex >= 3) {
        chapterAccessible = false;
        lockedReason = 'Este capitulo requiere plan Pro o Max. Los usuarios Free solo tienen acceso a los primeros 3 capitulos.';
      }
    }

    const allProgress = await this.progressRepo.find({ where: { chapterId: chapter.id, userId } });
    const progressMap = new Map(allProgress.map((p) => [p.moduleId, p]));

    let prevModuleCompleted = true;
    const modulesData = chapter.modules.map((mod) => {
      const progress = progressMap.get(mod.id);
      const isLesson = mod.type === 'lesson';

      // Unlock logic
      let unlocked = false;
      if (mod.order === 1) {
        unlocked = true;
      } else if (mod.order <= 3) {
        unlocked = prevModuleCompleted;
      } else {
        // Module 4 (final exam): needs mod 3 completed + (pro/max or paid)
        const mod3 = chapter.modules.find((m) => m.order === 3);
        const mod3Progress = mod3 ? progressMap.get(mod3.id) : null;
        const mod3Done = !!mod3Progress?.completed;
        // Demo: allow all plans to access final exam after mod 3
        unlocked = mod3Done;
      }

      // Lives for quiz sections
      let livesRemaining = -1; // -1 = unlimited (pro/max)
      const lockedUntil: string | null = null;
      if (userPlan === 'free' && !progress?.completed) {
        if (mod.type === 'lesson') {
          const attempts = progress?.quizAttempts || 0;
          livesRemaining = Math.max(0, 2 - attempts);
        }
      }

      const moduleCompleted = !!progress?.completed;
      prevModuleCompleted = moduleCompleted;

      return {
        id: mod.id,
        type: mod.type,
        order: mod.order,
        title: mod.title,
        xpReward: mod.xpReward,
        unlocked,
        completed: moduleCompleted,
        // Section progress (for lesson modules)
        sections: isLesson ? {
          info: { completed: !!progress?.infoCompleted, hasContent: !!mod.content },
          video: { completed: !!progress?.videoCompleted, progress: progress?.videoProgress || 0, hasVideo: !!mod.videoUrl },
          quiz: { completed: !!progress?.quizCompleted, score: progress?.quizScore || 0, attempts: progress?.quizAttempts || 0 },
        } : undefined,
        // For final exam
        score: progress?.score || 0,
        attempts: progress?.attempts || 0,
        livesRemaining,
        lockedUntil,
      };
    });

    const completedCount = modulesData.filter((m) => m.completed).length;

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      coverImage: chapter.coverImage,
      moduleTag: chapter.moduleTag,
      xpReward: chapter.xpReward,
      releaseWeek: chapter.releaseWeek,
      modules: chapterAccessible ? modulesData : [], // Don't send module data if locked
      completionPercent: chapterAccessible ? Math.round((completedCount / 4) * 100) : 0,
      plan: userPlan,
      accessible: chapterAccessible,
      lockedReason,
    };
  }

  // ── User: complete info section ──────────────────────────────────────────

  async completeInfoModule(moduleId: string, userId: string) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod || mod.type !== 'lesson') throw new BadRequestException('Not a lesson module');

    let progress = await this.getOrCreateProgress(mod.chapterId, moduleId, userId);
    progress.infoCompleted = true;
    return this.progressRepo.save(progress);
  }

  // ── User: update video progress ─────────────────────────────────────────

  async updateVideoProgress(moduleId: string, userId: string, percent: number) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod || mod.type !== 'lesson') throw new BadRequestException('Not a lesson module');

    let progress = await this.getOrCreateProgress(mod.chapterId, moduleId, userId);
    progress.videoProgress = Math.max(progress.videoProgress, percent);

    if (progress.videoProgress >= 90 && !progress.videoCompleted) {
      progress.videoCompleted = true;
    }

    return this.progressRepo.save(progress);
  }

  // ── User: get quiz questions (for module quiz or final exam) ─────────────

  async getQuizQuestions(moduleId: string, userId: string) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');

    const user = await this.usersRepo.findOne({ where: { id: userId } });

    // For lesson modules, verify info + video are done before quiz
    if (mod.type === 'lesson') {
      const progress = await this.progressRepo.findOne({ where: { moduleId, userId } });
      if (!progress?.infoCompleted) {
        throw new ForbiddenException('Completa la lectura primero');
      }
      if (mod.videoUrl && !progress?.videoCompleted) {
        throw new ForbiddenException('Completa el video primero');
      }
    }

    // Check attempts for free users on lesson modules
    if (user?.plan === 'free' && mod.type === 'lesson') {
      const progress = await this.progressRepo.findOne({ where: { moduleId, userId } });
      if (progress && !progress.completed) {
        if (progress.quizAttempts >= 2) {
          throw new ForbiddenException({
            message: 'Debes reiniciar el módulo para intentar de nuevo.',
            mustRedoModule: true,
            livesRemaining: 0,
          });
        }
      }
    }

    // For final exam, merge questions from all 3 lesson modules + final_exam-specific extras
    let pool: ChapterQuestion[] = [];
    if (mod.type === 'final_exam') {
      const chapter = await this.findOne(mod.chapterId);
      for (const m of chapter.modules) {
        if (m.type === 'lesson') {
          const mqs = await this.questionsRepo.find({ where: { moduleId: m.id } });
          pool.push(...mqs);
        }
      }
      // Also include final_exam-specific extra questions
      const extraQs = await this.questionsRepo.find({ where: { moduleId: mod.id } });
      pool.push(...extraQs);
    } else {
      pool = await this.questionsRepo.find({ where: { moduleId: mod.id } });
    }

    // Shuffle question order only (do NOT shuffle options — correctIndex must stay in sync)
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, mod.questionsPerAttempt || 5);

    return {
      moduleId: mod.id,
      chapterId: mod.chapterId,
      type: mod.type,
      passingScore: mod.passingScore,
      totalQuestions: selected.length,
      questions: selected.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    };
  }

  // ── User: submit quiz answers ────────────────────────────────────────────

  async submitQuiz(moduleId: string, userId: string, answers: { questionId: string; selectedIndex: number }[]) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Build question map from the correct pool
    let dbQuestions: ChapterQuestion[] = [];
    if (mod.type === 'final_exam') {
      const chapter = await this.findOne(mod.chapterId);
      for (const m of chapter.modules) {
        if (m.type === 'lesson') {
          const mqs = await this.questionsRepo.find({ where: { moduleId: m.id } });
          dbQuestions.push(...mqs);
        }
      }
      // Also include final_exam-specific extra questions
      const extraQs = await this.questionsRepo.find({ where: { moduleId: mod.id } });
      dbQuestions.push(...extraQs);
    } else {
      dbQuestions = await this.questionsRepo.find({ where: { moduleId: mod.id } });
    }
    const qMap = new Map(dbQuestions.map((q) => [q.id, q]));

    // Grade
    let correct = 0;
    const results = answers.map((a) => {
      const q = qMap.get(a.questionId);
      if (!q) return { questionId: a.questionId, correct: false };
      const ok = q.correctIndex === a.selectedIndex;
      if (ok) correct++;
      return { questionId: a.questionId, correct: ok, correctIndex: q.correctIndex, explanation: q.explanation };
    });

    const score = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;
    const passed = score >= mod.passingScore;
    let progress = await this.getOrCreateProgress(mod.chapterId, moduleId, userId);

    const isFinalExam = mod.type === 'final_exam';

    if (isFinalExam) {
      progress.attempts += 1;
      progress.score = Math.max(progress.score, score);
    } else {
      progress.quizAttempts += 1;
      progress.quizScore = Math.max(progress.quizScore, score);
    }

    if (passed) {
      if (isFinalExam && !progress.completed) {
        progress.completed = true;
        progress.score = Math.max(progress.score, score);
        progress.completedAt = new Date();
        progress.xpEarned = mod.xpReward;
        user.xp += mod.xpReward;
        user.totalXp += mod.xpReward;
        await this.usersRepo.save(user);

        // Trigger NFT mint for final exam completion
        if (user.stellarPublicKey) {
          try {
            const chapter = await this.chaptersRepo.findOne({ where: { id: mod.chapterId } });
            await this.sorobanService.mintCertificate({
              userPublicKey: user.stellarPublicKey,
              lessonId: mod.chapterId,
              moduleId: mod.id,
              username: user.username,
              score,
              xpEarned: mod.xpReward,
              metadataUri: `https://tonalli.app/certificates/${mod.chapterId}`,
            });
          } catch (e) {
            // Non-blocking: log but don't fail the quiz submission
            console.error('NFT mint error:', e.message);
          }

          // On-chain XLM reward via Learn-to-Earn contract
          try {
            const xlmAmount = (mod.xpReward || 50) / 100; // 0.5 XLM per 50 XP
            await this.sorobanService.rewardUser({
              userPublicKey: user.stellarPublicKey,
              lessonId: mod.chapterId,
              amountXlm: xlmAmount,
              score,
            });
          } catch (e) {
            console.error('On-chain reward error:', e.message);
          }

          // Mint TNL tokens
          try {
            const tnlAmount = (mod.xpReward || 50) / 10;
            await this.sorobanService.mintTokens(user.stellarPublicKey, tnlAmount);
          } catch (e) {
            console.error('TNL mint error:', e.message);
          }
        }
      } else if (!isFinalExam && !progress.quizCompleted) {
        progress.quizCompleted = true;
        progress.quizScore = Math.max(progress.quizScore, score);
        // Module complete when all 3 sections done
        if (progress.infoCompleted && (progress.videoCompleted || !mod.videoUrl)) {
          progress.completed = true;
          progress.completedAt = new Date();
          progress.xpEarned = mod.xpReward;
          user.xp += mod.xpReward;
          user.totalXp += mod.xpReward;
          await this.usersRepo.save(user);

          // On-chain XLM reward via Learn-to-Earn contract for lesson modules
          if (user.stellarPublicKey) {
            try {
              const xlmAmount = (mod.xpReward || 30) / 100; // 0.3 XLM per 30 XP
              await this.sorobanService.rewardUser({
                userPublicKey: user.stellarPublicKey,
                lessonId: mod.id,
                amountXlm: xlmAmount,
                score,
              });
            } catch (e) {
              console.error('On-chain reward error (module):', e.message);
            }

            try {
              const tnlAmount = (mod.xpReward || 30) / 10;
              await this.sorobanService.mintTokens(user.stellarPublicKey, tnlAmount);
            } catch (e) {
              console.error('TNL mint error (module):', e.message);
            }
          }
        }
      }
    }

    // Lives for free users
    let livesRemaining = -1;
    let mustRedoModule = false;
    if (user.plan === 'free' && !passed) {
      const failedAttempts = isFinalExam ? progress.attempts : progress.quizAttempts;
      if (failedAttempts >= 2 && !isFinalExam) {
        // Reset module progress — user must redo the full module
        progress.infoCompleted = false;
        progress.videoCompleted = false;
        progress.videoProgress = 0;
        progress.quizCompleted = false;
        progress.quizAttempts = 0;
        progress.quizScore = 0;
        progress.completed = false;
        livesRemaining = 0;
        mustRedoModule = true;
      } else {
        livesRemaining = Math.max(0, 2 - failedAttempts);
      }
    }

    await this.progressRepo.save(progress);

    let message: string;
    if (passed) {
      message = '¡Felicidades! Has aprobado.';
    } else if (mustRedoModule) {
      message = 'Agotaste tus 2 intentos. El módulo ha sido reiniciado, deberás completar la lectura y el video de nuevo.';
    } else if (livesRemaining === 1) {
      message = `Necesitas ${mod.passingScore}% para pasar. Obtuviste ${score}%. Te queda 1 intento.`;
    } else {
      message = `Necesitas ${mod.passingScore}% para pasar. Obtuviste ${score}%.${livesRemaining >= 0 ? ` Te quedan ${livesRemaining} intentos.` : ''}`;
    }

    return {
      score, passed, correctCount: correct, totalQuestions: answers.length, results,
      xpEarned: passed ? mod.xpReward : 0,
      livesRemaining,
      moduleCompleted: progress.completed,
      mustRedoModule: mustRedoModule || false,
      message,
    };
  }

  // ── User: report abandon ─────────────────────────────────────────────────

  async reportQuizAbandon(moduleId: string, userId: string, reason: string) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new BadRequestException('Module not found');
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    let progress = await this.getOrCreateProgress(mod.chapterId, moduleId, userId);

    if (progress.completed) return { penalized: false, reason: 'already_completed' };

    if (mod.type === 'final_exam') {
      progress.attempts += 1;
    } else {
      progress.quizAttempts += 1;
    }

    let livesRemaining = -1;
    let mustRedoModule = false;

    if (user?.plan === 'free') {
      const attempts = mod.type === 'final_exam' ? progress.attempts : progress.quizAttempts;
      if (attempts >= 2 && mod.type !== 'final_exam') {
        // Reset module progress — user must redo the full module
        progress.infoCompleted = false;
        progress.videoCompleted = false;
        progress.videoProgress = 0;
        progress.quizCompleted = false;
        progress.quizAttempts = 0;
        progress.quizScore = 0;
        progress.completed = false;
        livesRemaining = 0;
        mustRedoModule = true;
      } else {
        livesRemaining = Math.max(0, 2 - attempts);
      }
    }

    await this.progressRepo.save(progress);

    let message: string;
    if (mustRedoModule) {
      message = 'Agotaste tus 2 intentos al abandonar. El módulo ha sido reiniciado, deberás completar la lectura y el video de nuevo.';
    } else if (livesRemaining === 1) {
      message = `Perdiste un intento por abandonar el quiz. Te queda 1 intento.`;
    } else {
      message = `Perdiste un intento por abandonar el quiz.${livesRemaining >= 0 ? ` Te quedan ${livesRemaining} intentos.` : ''}`;
    }

    return {
      penalized: true, reason, livesRemaining,
      mustRedoModule: mustRedoModule || false,
      message,
    };
  }

  // ── User: unlock final exam (Pro pays $2, Max free, Free cannot) ────────

  async unlockFinalExam(chapterId: string, userId: string) {
    const chapter = await this.findOne(chapterId);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const userPlan = user?.plan || 'free';

    // Plan gate disabled for demo
    // if (userPlan === 'free') {
    //   throw new ForbiddenException('Los usuarios Free no pueden acceder a certificaciones. Mejora tu plan a Pro o Max.');
    // }

    const mod4 = chapter.modules.find((m) => m.order === 4);
    if (!mod4) throw new NotFoundException('Final exam not found');

    const mod3 = chapter.modules.find((m) => m.order === 3);
    if (mod3) {
      const p = await this.progressRepo.findOne({ where: { moduleId: mod3.id, userId } });
      if (!p?.completed) throw new ForbiddenException('Completa el Módulo 3 primero');
    }

    await this.getOrCreateProgress(chapterId, mod4.id, userId);
    // Pro: $2 USD per certification, Max: free
    const certCost = userPlan === 'pro' ? 2 : 0;
    return { unlocked: true, moduleId: mod4.id, certCost };
  }

  // ── User: get module detail (info content) ──────────────────────────────

  async getModuleContent(moduleId: string) {
    const mod = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    const questionCount = await this.questionsRepo.count({ where: { moduleId: mod.id } });
    return {
      id: mod.id,
      type: mod.type,
      order: mod.order,
      title: mod.title,
      content: mod.content,
      videoUrl: mod.videoUrl,
      hasQuiz: questionCount > 0 || mod.type === 'final_exam',
    };
  }

  // ── Helper ──────────────────────────────────────────────────────────────

  private async getOrCreateProgress(chapterId: string, moduleId: string, userId: string) {
    let progress = await this.progressRepo.findOne({ where: { moduleId, userId } });
    if (!progress) {
      progress = this.progressRepo.create({
        userId, chapterId, moduleId,
        infoCompleted: false, videoCompleted: false, videoProgress: 0,
        quizCompleted: false, quizScore: 0, quizAttempts: 0,
        completed: false, score: 0, attempts: 0, xpEarned: 0,
      });
      progress = await this.progressRepo.save(progress);
    }
    return progress;
  }
}
