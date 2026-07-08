import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsDocument = Analytics & Document;

@Schema({ timestamps: true })
export class Analytics {
  @Prop({ required: true })
  userId: Types.ObjectId;

  // Daily Metrics
  @Prop({ type: Date, required: true })
  date: Date;

  // Application Metrics
  @Prop({ default: 0 })
  applicationsSent: number;

  @Prop({ default: 0 })
  applicationsViewed: number;

  @Prop({ default: 0 })
  interviewsReceived: number;

  @Prop({ default: 0 })
  offersReceived: number;

  @Prop({ default: 0 })
  rejectionsReceived: number;

  // Job Search Metrics
  @Prop({ default: 0 })
  jobsSearched: number;

  @Prop({ default: 0 })
  jobsSaved: number;

  @Prop({ default: 0 })
  jobsApplied: number;

  // Resume Metrics
  @Prop({ default: 0 })
  resumesUploaded: number;

  @Prop({ default: 0 })
  resumesTailored: number;

  @Prop({ default: 0 })
  coverLettersGenerated: number;

  // Interview Metrics
  @Prop({ default: 0 })
  mockInterviewsCompleted: number;

  @Prop({ default: 0 })
  averageInterviewScore: number;

  // Auto-Apply Metrics
  @Prop({ default: 0 })
  autoApplicationsSent: number;

  @Prop({ default: 0 })
  autoApplicationsSuccess: number;

  @Prop({ default: 0 })
  autoApplicationsFailed: number;

  // AI Usage
  @Prop({ default: 0 })
  aiRequestsCount: number;

  @Prop({ default: 0 })
  aiTokensUsed: number;

  // Engagement
  @Prop({ default: 0 })
  sessionDuration: number; // minutes

  @Prop({ default: 0 })
  pageViews: number;

  @Prop({ default: 0 })
  featuresUsed: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);

// Indexes
AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ date: 1 });

// Aggregate metrics by week/month
AnalyticsSchema.statics.aggregateByPeriod = function (userId: Types.ObjectId, period: 'week' | 'month', startDate: Date, endDate: Date) {
  const groupBy = period === 'week' ? { $week: '$date' } : { $month: '$date' };
  
  return this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupBy,
        totalApplications: { $sum: '$applicationsSent' },
        totalInterviews: { $sum: '$interviewsReceived' },
        totalOffers: { $sum: '$offersReceived' },
        totalRejections: { $sum: '$rejectionsReceived' },
        avgInterviewScore: { $avg: '$averageInterviewScore' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};
