import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ChaptersService } from './chapters.service';
import { CACHE_CHAPTERS_LIST } from '../cache/cache.constants';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { ChapterModule } from './entities/chapter-module.entity';
import { ChapterProgress } from './entities/chapter-progress.entity';
import { ChapterQuestion } from './entities/chapter-question.entity';
import { User } from '../users/entities/user.entity';
import { SorobanService } from '../stellar/soroban.service';

describe('ChaptersService Cache Invalidation', () => {
  let service: ChaptersService;
  let cacheManager: any;
  let chaptersRepo: Repository<Chapter>;

  const mockChapterRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: '1', ...entity })),
    find: jest.fn().mockResolvedValue([{ id: '1', title: 'Chapter 1', published: true }]),
    findOne: jest.fn().mockResolvedValue({ id: '1', title: 'Chapter 1', published: true }),
    remove: jest.fn().mockResolvedValue(true),
  };

  const mockModulesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn().mockResolvedValue({ id: 'mod1', chapterId: '1', type: 'lesson' }),
  };

  const mockProgressRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => entity),
  };

  const mockQuestionsRepo = {
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(true),
  };

  const mockUsersRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'user1', plan: 'pro' }),
  };

  const mockSorobanService = {
    mintCertificate: jest.fn().mockResolvedValue({ success: true }),
    rewardUser: jest.fn().mockResolvedValue({ success: true }),
    mintTokens: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockCacheManager = {
    del: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        { provide: getRepositoryToken(Chapter), useValue: mockChapterRepo },
        { provide: getRepositoryToken(ChapterModule), useValue: mockModulesRepo },
        { provide: getRepositoryToken(ChapterProgress), useValue: mockProgressRepo },
        { provide: getRepositoryToken(ChapterQuestion), useValue: mockQuestionsRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: SorobanService, useValue: mockSorobanService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ChaptersService>(ChaptersService);
    cacheManager = module.get(CACHE_MANAGER);
    chaptersRepo = module.get(getRepositoryToken(Chapter));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should invalidate chapters cache after creating chapter', async () => {
      const dto = { title: 'New Chapter', description: 'Test' };
      await service.create(dto);

      expect(cacheManager.del).toHaveBeenCalledWith(CACHE_CHAPTERS_LIST);
    });
  });

  describe('update', () => {
    it('should invalidate chapters cache after updating chapter', async () => {
      const id = '1';
      const dto = { title: 'Updated' };
      await service.update(id, dto);

      expect(cacheManager.del).toHaveBeenCalledWith(CACHE_CHAPTERS_LIST);
    });
  });

  describe('remove', () => {
    it('should invalidate chapters cache after removing chapter', async () => {
      const id = '1';
      await service.remove(id);

      expect(cacheManager.del).toHaveBeenCalledWith(CACHE_CHAPTERS_LIST);
    });
  });

  describe('togglePublish', () => {
    it('should invalidate chapters cache after toggling publish', async () => {
      const id = '1';
      await service.togglePublish(id);

      expect(cacheManager.del).toHaveBeenCalledWith(CACHE_CHAPTERS_LIST);
    });
  });

  describe('setReleaseWeek', () => {
    it('should invalidate chapters cache after setting release week', async () => {
      const id = '1';
      const week = '2026-W18';
      await service.setReleaseWeek(id, week);

      expect(cacheManager.del).toHaveBeenCalledWith(CACHE_CHAPTERS_LIST);
    });
  });
});