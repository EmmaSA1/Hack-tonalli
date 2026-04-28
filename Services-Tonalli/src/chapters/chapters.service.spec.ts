import { ForbiddenException } from '@nestjs/common';
import { ChaptersService } from './chapters.service';

describe('ChaptersService', () => {
  const chaptersRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
  const modulesRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const progressRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const questionsRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const usersRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const sorobanService = {
    mintCertificate: jest.fn(),
    rewardUser: jest.fn(),
    mintTokens: jest.fn(),
  };

  let service: ChaptersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ChaptersService(
      chaptersRepo as any,
      modulesRepo as any,
      progressRepo as any,
      questionsRepo as any,
      usersRepo as any,
      sorobanService as any,
    );
  });

  it('marks paid chapters inaccessible for free users', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', plan: 'free' });
    chaptersRepo.find.mockResolvedValue([
      {
        id: 'chapter-1',
        title: 'Premium chapter',
        description: 'desc',
        moduleTag: 'stellar',
        order: 1,
        published: true,
        coverImage: null,
        estimatedMinutes: 20,
        xpReward: 50,
        releaseWeek: null,
        requiredPlan: 'pro',
        modules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.findPublishedForUser('user-1');

    expect(result[0].accessible).toBe(false);
    expect(result[0].lockedReason).toBe('requires_pro');
  });

  it('blocks free users from unlocking the final exam', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'user-1', plan: 'free' });
    chaptersRepo.findOne.mockResolvedValue({
      id: 'chapter-1',
      requiredPlan: 'free',
      modules: [
        { id: 'm3', order: 3, type: 'lesson' },
        { id: 'm4', order: 4, type: 'final_exam' },
      ],
    });
    progressRepo.findOne.mockResolvedValue({ completed: true });

    await expect(service.unlockFinalExam('chapter-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
