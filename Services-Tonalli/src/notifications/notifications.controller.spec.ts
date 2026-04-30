import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';

const mockNotif = (): Notification =>
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
  }) as Notification;

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    findByUser: jest.Mock;
    getUnreadCount: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    deleteNotification: jest.Mock;
  };

  const mockReq = { user: { userId: 'user-1' } };

  beforeEach(async () => {
    service = {
      findByUser: jest.fn().mockResolvedValue([mockNotif()]),
      getUnreadCount: jest.fn().mockResolvedValue(2),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      markAllAsRead: jest.fn().mockResolvedValue(undefined),
      deleteNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET / ────────────────────────────────────────────────────────────────

  describe('getNotifications', () => {
    it('returns notifications and unread count with defaults', async () => {
      const result = await controller.getNotifications(mockReq as any);
      expect(service.findByUser).toHaveBeenCalledWith('user-1', 50, false);
      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(2);
    });

    it('parses limit and unreadOnly query params', async () => {
      await controller.getNotifications(mockReq as any, '10', 'true');
      expect(service.findByUser).toHaveBeenCalledWith('user-1', 10, true);
    });

    it('treats unreadOnly=false correctly', async () => {
      await controller.getNotifications(mockReq as any, '20', 'false');
      expect(service.findByUser).toHaveBeenCalledWith('user-1', 20, false);
    });
  });

  // ── GET /unread-count ────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns the unread count for the user', async () => {
      const result = await controller.getUnreadCount(mockReq as any);
      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ count: 2 });
    });
  });

  // ── POST /:id/read ───────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read and returns success', async () => {
      const result = await controller.markAsRead(mockReq as any, 'notif-1');
      expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result).toEqual({ success: true });
    });
  });

  // ── POST /read-all ───────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all notifications as read and returns success', async () => {
      const result = await controller.markAllAsRead(mockReq as any);
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ success: true });
    });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes a notification and returns success', async () => {
      const result = await controller.deleteNotification(
        mockReq as any,
        'notif-1',
      );
      expect(service.deleteNotification).toHaveBeenCalledWith(
        'notif-1',
        'user-1',
      );
      expect(result).toEqual({ success: true });
    });
  });
});
