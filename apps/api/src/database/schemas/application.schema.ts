import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  WISHLIST = 'wishlist',
  SAVED = 'saved',
  APPLIED = 'applied',
  ASSESSMENT = 'assessment',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum InterviewStage {
  PHONE_SCREEN = 'phone_screen',
  TECHNICAL = 'technical',
  CODING_CHALLENGE = 'coding_challenge',
  SYSTEM_DESIGN = 'system_design',
  BEHAVIORAL = 'behavioral',
  ONSITE = 'onsite',
  FINAL = 'final',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Application {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  jobId: Types.ObjectId;

  @Prop({ required: true, default: ApplicationStatus.WISHLIST })
  status: ApplicationStatus;

  @Prop()
  resumeId?: Types.ObjectId;

  @Prop()
  coverLetterId?: Types.ObjectId;

  // Application Details
  @Prop()
  appliedAt?: Date;

  @Prop()
  applicationUrl?: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  company?: string;

  @Prop()
  location?: string;

  @Prop()
  salaryRange?: string;

  // Interview Tracking
  @Prop({ type: [{ 
    stage: String, 
    scheduledAt: Date, 
    completedAt: Date, 
    notes: String, 
    feedback: String,
    interviewerName: String,
    interviewerEmail: String,
  }] })
  interviewStages: Array<{
    stage: InterviewStage;
    scheduledAt?: Date;
    completedAt?: Date;
    notes?: string;
    feedback?: string;
    interviewerName?: string;
    interviewerEmail?: string;
  }>;

  @Prop()
  nextInterviewDate?: Date;

  // Auto-Apply Tracking
  @Prop({ default: false })
  isAutoApplied: boolean;

  @Prop()
  autoApplyStatus?: 'pending' | 'in-progress' | 'completed' | 'failed';

  @Prop({ type: [String] })
  autoApplyLogs?: string[];

  @Prop()
  autoApplyScreenshot?: string;

  @Prop()
  autoApplyError?: string;

  @Prop({ default: 0 })
  autoApplyRetries: number;

  // Notes & Reminders
  @Prop({ type: [{ content: String, createdAt: Date, updatedAt: Date }] })
  notes: Array<{
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  @Prop({ type: [{ reminderAt: Date, message: String, isCompleted: Boolean }] })
  reminders: Array<{
    reminderAt: Date;
    message: string;
    isCompleted: boolean;
  }>;

  // AI Analysis
  @Prop({ type: Object })
  aiAnalysis?: {
    applicationStrength: number;
    suggestedImprovements: string[];
    estimatedResponseTime: string;
    competitionLevel: 'low' | 'medium' | 'high';
  };

  // Timeline
  @Prop({ type: [{ status: String, timestamp: Date, note: String }] })
  timeline: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;

  // Outcome
  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  offerReceivedAt?: Date;

  @Prop()
  offerDetails?: {
    baseSalary: number;
    equity?: number;
    bonus?: number;
    benefits: string[];
    startDate?: Date;
  };

  @Prop()
  offerAcceptedAt?: Date;

  @Prop()
  offerDeclinedAt?: Date;

  @Prop()
  withdrawnAt?: Date;

  @Prop()
  withdrawalReason?: string;

  // Rating
  @Prop({ min: 1, max: 5 })
  userRating?: number;

  @Prop()
  userNotes?: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Indexes
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ userId: 1, appliedAt: -1 });
ApplicationSchema.index({ userId: 1, nextInterviewDate: 1 });
ApplicationSchema.index({ status: 1, appliedAt: -1 });
ApplicationSchema.index({ isAutoApplied: 1, autoApplyStatus: 1 });

// Virtual for days in current status
ApplicationSchema.virtual('daysInCurrentStatus').get(function () {
  const now = new Date();
  const lastUpdate = this.updatedAt || this.createdAt;
  return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
});

// Method to add timeline entry
ApplicationSchema.methods.addTimelineEntry = function (status: string, note?: string) {
  if (!this.timeline) {
    this.timeline = [];
  }
  this.timeline.push({
    status,
    timestamp: new Date(),
    note,
  });
};

// Pre-save hook to update timeline on status change
ApplicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.addTimelineEntry(this.status);
  }
  next();
});
