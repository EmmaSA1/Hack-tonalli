import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = req.user.userId;
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const isUnreadOnly = unreadOnly === 'true';

    const notifications = await this.notificationsService.findByUser(
      userId,
      parsedLimit,
      isUnreadOnly,
    );

    return {
      notifications,
      unreadCount: await this.notificationsService.getUnreadCount(userId),
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    const userId = req.user.userId;
    await this.notificationsService.markAsRead(notificationId, userId);
    return { success: true };
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @Request() req,
    @Param('id') notificationId: string,
  ) {
    const userId = req.user.userId;
    await this.notificationsService.deleteNotification(notificationId, userId);
    return { success: true };
  }
}
