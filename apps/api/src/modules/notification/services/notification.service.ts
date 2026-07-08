import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { CreateNotificationDto, NotificationChannel } from '../dtos/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, dto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      user: userId,
      ...dto,
      status: 'pending',
    });

    // Send notification based on channel
    await this.sendNotification(notification);

    return notification.save();
  }

  async findAll(userId: string, filters?: { status?: string; type?: string }): Promise<Notification[]> {
    const query: any = { user: userId };
    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;

    return this.notificationModel.find(query).sort({ createdAt: -1 }).limit(50).exec();
  }

  async markAsRead(userId: string, id: string): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate({ _id: id, user: userId }, { status: 'read', readAt: new Date() }, { new: true })
      .exec();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany({ user: userId, status: 'pending' }, { status: 'read', readAt: new Date() })
      .exec();
    return result.modifiedCount;
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.notificationModel.deleteOne({ _id: id, user: userId }).exec();
  }

  async sendJobAlert(userId: string, jobData: any): Promise<void> {
    await this.create(userId, {
      type: 'job_alert',
      channel: 'email',
      title: `New Job Match: ${jobData.title}`,
      message: `Found a great match for you at ${jobData.company}!`,
      data: { jobId: jobData.id, matchScore: jobData.matchScore },
    });
  }

  async sendInterviewReminder(userId: string, interviewData: any): Promise<void> {
    await this.create(userId, {
      type: 'interview_reminder',
      channel: 'email',
      title: `Interview Reminder: ${interviewData.company}`,
      message: `Your interview is scheduled for ${interviewData.scheduledAt}`,
      data: { interviewId: interviewData.id },
    });
  }

  async sendApplicationUpdate(userId: string, applicationData: any): Promise<void> {
    await this.create(userId, {
      type: 'application_update',
      channel: 'email',
      title: `Application Update: ${applicationData.company}`,
      message: `Your application status changed to ${applicationData.status}`,
      data: { applicationId: applicationData.id, status: applicationData.status },
    });
  }

  private async sendNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationChannel.PUSH:
          await this.sendPush(notification);
          break;
        case NotificationChannel.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationChannel.SLACK:
          await this.sendSlack(notification);
          break;
        case NotificationChannel.DISCORD:
          await this.sendDiscord(notification);
          break;
      }

      notification.status = 'sent';
      notification.sentAt = new Date();
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      notification.status = 'failed';
      notification.error = error.message;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    // Integrate with Resend/SendGrid in production
    this.logger.log(`Email sent to ${notification.user}: ${notification.title}`);
  }

  private async sendPush(notification: Notification): Promise<void> {
    // Integrate with Firebase/OneSignal in production
    this.logger.log(`Push notification sent: ${notification.title}`);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // Integrate with Twilio in production
    this.logger.log(`SMS sent: ${notification.message}`);
  }

  private async sendSlack(notification: Notification): Promise<void> {
    // Integrate with Slack API in production
    this.logger.log(`Slack notification sent: ${notification.title}`);
  }

  private async sendDiscord(notification: Notification): Promise<void> {
    // Integrate with Discord webhook in production
    this.logger.log(`Discord notification sent: ${notification.title}`);
  }
}
