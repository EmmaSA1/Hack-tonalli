import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

const mockNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  ({
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.LESSON_COMPLETED,
    title: 'Lesson Completed! ✅',
    message: 'Great job!',
    metadata: {},
    read: false,
    createdAt: new Date(),
    user: null as any,
    ...overrides,
  }) as Notification;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  // Shared query builder mock
  const qbMock = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves a notification', async () => {
      const notif = mockNotification();
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      const dto = {
        userId: 'user-1',
        type: NotificationType.LESSON_COMPLETED,
        title: 'Lesson Completed! ✅',
        message: 'Great job!',
      };

      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(notif);
      expect(result).toEqual(notif);
    });
  });

  // ── findByUser ───────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('returns notifications for a user with default limit', async () => {
      const notifs = [mockNotification()];
      qbMock.getMany.mockResolvedValue(notifs);

      const result = await service.findByUser('user-1');
      expect(qbMock.where).toHaveBeenCalledWith(
        'notification.userId = :userId',
        { userId: 'user-1' },
      );
      expect(qbMock.limit).toHaveBeenCalledWith(50);
      expect(qbMock.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(notifs);
    });

    it('applies unreadOnly filter when requested', async () => {
      qbMock.getMany.mockResolvedValue([]);

      await service.findByUser('user-1', 10, true);
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'notification.read = :read',
        { read: false },
      );
      expect(qbMock.limit).toHaveBeenCalledWith(10);
    });
  });

  // ── markAsRead ───────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('updates the notification to read=true', async () => {
      repo.update.mockResolvedValue({ affected: 1 });
      await service.markAsRead('notif-1', 'user-1');
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'user-1' },
        { read: true },
      );
    });
  });

  // ── markAllAsRead ────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read for a user', async () => {
      repo.update.mockResolvedValue({ affected: 5 });
      await service.markAllAsRead('user-1');
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1', read: false },
        { read: true },
      );
    });
  });

  // ── getUnreadCount ───────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns the count of unread notifications', async () => {
      repo.count.mockResolvedValue(3);
      const count = await service.getUnreadCount('user-1');
      expect(count).toBe(3);
      expect(repo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  // ── deleteNotification ───────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes the notification by id and userId', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });
      await service.deleteNotification('notif-1', 'user-1');
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'notif-1',
        userId: 'user-1',
      });
    });
  });

  // ── helper notification methods ──────────────────────────────────────────

  describe('notifyCertificateIssued', () => {
    it('creates a CERTIFICATE_ISSUED notification', async () => {
      const notif = mockNotification({
        type: NotificationType.CERTIFICATE_ISSUED,
      });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      const result = await service.notifyCertificateIssued('user-1', {
        title: 'Blockchain Basics',
        txHash: 'abc123',
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.CERTIFICATE_ISSUED }),
      );
      expect(result).toEqual(notif);
    });
  });

  describe('notifyRewardProcessed', () => {
    it('creates a REWARD_PROCESSED notification', async () => {
      const notif = mockNotification({
        type: NotificationType.REWARD_PROCESSED,
      });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyRewardProcessed('user-1', {
        amount: '10',
        currency: 'XLM',
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.REWARD_PROCESSED }),
      );
    });
  });

  describe('notifyStreakLost', () => {
    it('creates a STREAK_LOST notification', async () => {
      const notif = mockNotification({ type: NotificationType.STREAK_LOST });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyStreakLost('user-1', { daysLost: 5 });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.STREAK_LOST }),
      );
    });
  });

  describe('notifyStreakMilestone', () => {
    it('creates a STREAK_MILESTONE notification', async () => {
      const notif = mockNotification({
        type: NotificationType.STREAK_MILESTONE,
      });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyStreakMilestone('user-1', { currentStreak: 30 });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.STREAK_MILESTONE }),
      );
    });
  });

  describe('notifyLevelUp', () => {
    it('creates a LEVEL_UP notification', async () => {
      const notif = mockNotification({ type: NotificationType.LEVEL_UP });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyLevelUp('user-1', { newLevel: 5, xpEarned: 100 });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.LEVEL_UP }),
      );
    });
  });

  describe('notifyPodiumReward', () => {
    it('creates a PODIUM_REWARD notification', async () => {
      const notif = mockNotification({ type: NotificationType.PODIUM_REWARD });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyPodiumReward('user-1', {
        position: 1,
        reward: '50 XLM',
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.PODIUM_REWARD }),
      );
    });
  });

  describe('notifyLessonCompleted', () => {
    it('creates a LESSON_COMPLETED notification', async () => {
      const notif = mockNotification({
        type: NotificationType.LESSON_COMPLETED,
      });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyLessonCompleted('user-1', {
        title: 'Intro to Stellar',
        xpEarned: 50,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.LESSON_COMPLETED }),
      );
    });
  });

  describe('notifyChapterCompleted', () => {
    it('creates a CHAPTER_COMPLETED notification', async () => {
      const notif = mockNotification({
        type: NotificationType.CHAPTER_COMPLETED,
      });
      repo.create.mockReturnValue(notif);
      repo.save.mockResolvedValue(notif);

      await service.notifyChapterCompleted('user-1', {
        title: 'Chapter 1',
        score: 95,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.CHAPTER_COMPLETED }),
      );
    });
  });
});
