import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(dto);
    await this.notificationRepo.save(notification);
    this.logger.log(`Notification created: ${dto.type} for user ${dto.userId}`);
    return notification;
  }

  async findByUser(
    userId: string,
    limit = 50,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .limit(limit);

    if (unreadOnly) {
      query.andWhere('notification.read = :read', { read: false });
    }

    return query.getMany();
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId, userId },
      { read: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, read: false },
    });
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationRepo.delete({ id: notificationId, userId });
  }

  // ── Helper methods for common notification types ──

  async notifyCertificateIssued(
    userId: string,
    certificateData: { title: string; txHash?: string; vcId?: string },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.CERTIFICATE_ISSUED,
      title: 'Certificate Issued! 🎓',
      message: `Your certificate for "${certificateData.title}" has been issued on the blockchain.`,
      metadata: certificateData,
    });
  }

  async notifyRewardProcessed(
    userId: string,
    rewardData: { amount: string; currency: string; txHash?: string },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.REWARD_PROCESSED,
      title: 'Reward Received! 💰',
      message: `You've received ${rewardData.amount} ${rewardData.currency} as a reward!`,
      metadata: rewardData,
    });
  }

  async notifyStreakLost(
    userId: string,
    streakData: { daysLost: number },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.STREAK_LOST,
      title: 'Streak Lost 😢',
      message: `Your ${streakData.daysLost}-day streak has ended. Start a new one today!`,
      metadata: streakData,
    });
  }

  async notifyStreakMilestone(
    userId: string,
    streakData: { currentStreak: number },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.STREAK_MILESTONE,
      title: 'Streak Milestone! 🔥',
      message: `Amazing! You've reached a ${streakData.currentStreak}-day streak!`,
      metadata: streakData,
    });
  }

  async notifyLevelUp(
    userId: string,
    levelData: { newLevel: number; xpEarned: number },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.LEVEL_UP,
      title: 'Level Up! ⬆️',
      message: `Congratulations! You've reached level ${levelData.newLevel}!`,
      metadata: levelData,
    });
  }

  async notifyPodiumReward(
    userId: string,
    podiumData: { position: number; reward: string },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.PODIUM_REWARD,
      title: 'Podium Reward! 🏆',
      message: `You finished #${podiumData.position} this week and earned ${podiumData.reward}!`,
      metadata: podiumData,
    });
  }

  async notifyLessonCompleted(
    userId: string,
    lessonData: { title: string; xpEarned: number },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.LESSON_COMPLETED,
      title: 'Lesson Completed! ✅',
      message: `Great job completing "${lessonData.title}"! You earned ${lessonData.xpEarned} XP.`,
      metadata: lessonData,
    });
  }

  async notifyChapterCompleted(
    userId: string,
    chapterData: { title: string; score: number },
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.CHAPTER_COMPLETED,
      title: 'Chapter Completed! 📚',
      message: `Excellent! You completed "${chapterData.title}" with a score of ${chapterData.score}%.`,
      metadata: chapterData,
    });
  }
}
