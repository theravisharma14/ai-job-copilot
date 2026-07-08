import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewDocument = Interview & Document;

export enum InterviewType {
  MOCK = 'mock',
  REAL = 'real',
}

export enum InterviewCategory {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  CODING = 'coding',
  SYSTEM_DESIGN = 'system_design',
  CASE_STUDY = 'case_study',
  PRESENTATION = 'presentation',
}

export enum InterviewMode {
  TEXT = 'text',
  VOICE = 'voice',
  VIDEO = 'video',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Interview {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: InterviewType.MOCK })
  type: InterviewType;

  @Prop({ required: true, default: InterviewCategory.BEHAVIORAL })
  category: InterviewCategory;

  @Prop({ required: true, default: InterviewMode.TEXT })
  mode: InterviewMode;

  // For real interviews
  @Prop()
  applicationId?: Types.ObjectId;

  @Prop()
  jobId?: Types.ObjectId;

  @Prop()
  company?: string;

  @Prop()
  role?: string;

  // Scheduling (for real interviews)
  @Prop()
  scheduledAt?: Date;

  @Prop()
  duration?: number; // minutes

  @Prop()
  timezone?: string;

  @Prop()
  meetingLink?: string;

  @Prop()
  interviewerName?: string;

  @Prop()
  interviewerEmail?: string;

  // Mock Interview Configuration
  @Prop({ default: 30 })
  questionCount: number;

  @Prop({ default: 60 })
  timePerQuestion: number; // seconds

  @Prop({ type: [String] })
  focusAreas?: string[];

  @Prop()
  difficulty?: 'easy' | 'medium' | 'hard';

  // Questions & Answers
  @Prop({
    type: [{
      question: String,
      answer: String,
      aiFeedback: String,
      score: Number,
      duration: Number,
      transcript: String,
    }],
  })
  questions: Array<{
    question: string;
    answer?: string;
    aiFeedback?: string;
    score?: number;
    duration?: number; // seconds spent answering
    transcript?: string; // for voice/video interviews
  }>;

  // Scoring
  @Prop({ default: 0 })
  overallScore: number;

  @Prop({ type: Object })
  scoringBreakdown?: {
    technicalKnowledge: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    clarity: number;
  };

  // AI Feedback
  @Prop({ type: Object })
  aiFeedback?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    improvementPlan: string[];
    suggestedResources: string[];
    overallAssessment: string;
  };

  // Recording (for voice/video)
  @Prop()
  recordingUrl?: string;

  @Prop()
  recordingDuration?: number; // seconds

  @Prop()
  transcription?: string;

  // Status
  @Prop({ default: 'scheduled' })
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  // User Reflection
  @Prop()
  userReflection?: string;

  @Prop({ type: [String] })
  keyTakeaways?: string[];

  @Prop({ min: 1, max: 5 })
  userRating?: number;

  @Prop()
  wouldRecommend?: boolean;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

// Indexes
InterviewSchema.index({ userId: 1, type: 1 });
InterviewSchema.index({ userId: 1, status: 1 });
InterviewSchema.index({ userId: 1, scheduledAt: -1 });
InterviewSchema.index({ userId: 1, completedAt: -1 });
InterviewSchema.index({ applicationId: 1 });
InterviewSchema.index({ status: 1, scheduledAt: 1 });

// Virtual for interview preparation time
InterviewSchema.virtual('preparationTime').get(function () {
  if (!this.scheduledAt || !this.createdAt) return 0;
  return Math.floor((this.scheduledAt.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60)); // hours
});

// Method to calculate overall score
InterviewSchema.methods.calculateOverallScore = function () {
  if (!this.scoringBreakdown) return 0;
  
  const breakdown = this.scoringBreakdown;
  const weights = {
    technicalKnowledge: 0.3,
    communication: 0.2,
    problemSolving: 0.25,
    confidence: 0.15,
    clarity: 0.1,
  };
  
  this.overallScore = Math.round(
    (breakdown.technicalKnowledge * weights.technicalKnowledge +
     breakdown.communication * weights.communication +
     breakdown.problemSolving * weights.problemSolving +
     breakdown.confidence * weights.confidence +
     breakdown.clarity * weights.clarity) * 100
  );
  
  return this.overallScore;
};
