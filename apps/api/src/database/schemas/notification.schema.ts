import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
  IN_APP = 'in_app',
}

export enum NotificationCategory {
  APPLICATION_UPDATE = 'application_update',
  INTERVIEW_REMINDER = 'interview_reminder',
  JOB_ALERT = 'job_alert',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  SECURITY = 'security',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: NotificationType.IN_APP })
  type: NotificationType;

  @Prop({ required: true })
  category: NotificationCategory;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop()
  actionUrl?: string;

  @Prop()
  actionLabel?: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isDelivered: boolean;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: false })
  isFailed: boolean;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  scheduledFor?: Date;

  @Prop()
  expiresAt?: Date;

  // Email specific
  @Prop()
  emailSubject?: string;

  @Prop()
  emailFrom?: string;

  @Prop()
  emailTo?: string;

  @Prop({ type: Object })
  emailTemplate?: {
    templateId: string;
    variables: Record<string, any>;
  };

  // Push specific
  @Prop()
  pushToken?: string;

  @Prop({ type: Object })
  pushPayload?: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
  };

  // SMS specific
  @Prop()
  phoneNumber?: string;

  // Slack/Discord specific
  @Prop()
  webhookUrl?: string;

  @Prop({ type: Object })
  integrationPayload?: Record<string, any>;

  // Priority
  @Prop({ default: 'normal' })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Prop({ default: true })
  userEnabled: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, category: 1, isRead: 1 });
NotificationSchema.index({ type: 1, isDelivered: 1 });
NotificationSchema.index({ scheduledFor: 1 }, { sparse: true });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Static method to find unread notifications for user
NotificationSchema.statics.findUnreadByUser = function (userId: Types.ObjectId, limit: number = 20) {
  return this.find({
    userId: new Types.ObjectId(userId),
    isRead: false,
    userEnabled: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = function (userId: Types.ObjectId) {
  return this.updateMany(
    {
      userId: new Types.ObjectId(userId),
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    },
  );
};

// Method to mark as read
NotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};
