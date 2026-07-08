import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dtos/notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for user' })
  findAll(@CurrentUser() userId: string, @Query('status') status?: string, @Query('type') type?: string) {
    return this.notificationService.findAll(userId, { status, type });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  create(@CurrentUser() userId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationService.create(userId, dto);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  delete(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.notificationService.delete(userId, id);
  }
}
