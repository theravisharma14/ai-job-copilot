import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFY = 'email_verify',
  SUBSCRIPTION_CHANGE = 'subscription_change',
  API_CALL = 'api_call',
  AUTO_APPLY = 'auto_apply',
  RESUME_TAILOR = 'resume_tailor',
  COVER_LETTER_GENERATE = 'cover_letter_generate',
  JOB_MATCH = 'job_match',
  INTERVIEW_START = 'interview_start',
  INTERVIEW_COMPLETE = 'interview_complete',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  action: AuditAction;

  @Prop({ required: true, default: AuditStatus.SUCCESS })
  status: AuditStatus;

  @Prop({ required: true })
  resource: string; // e.g., 'user', 'resume', 'job', 'application'

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Object })
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  stackTrace?: string;

  @Prop({ default: false })
  isSensitive: boolean;

  @Prop()
  retentionDays: number;

  @Prop()
  expiresAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Static method to find recent logs for user
AuditLogSchema.statics.findRecentByUser = function (userId: Types.ObjectId, limit: number = 50) {
  return this.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find failed actions
AuditLogSchema.statics.findFailures = function (startDate: Date, endDate: Date) {
  return this.find({
    status: AuditStatus.FAILURE,
    createdAt: { $gte: startDate, $lte: endDate },
  }).sort({ createdAt: -1 });
};
