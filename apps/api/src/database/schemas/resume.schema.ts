import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResumeDocument = Resume & Document;

export enum ResumeStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Resume {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: ResumeStatus.DRAFT })
  status: ResumeStatus;

  // Personal Information
  @Prop()
  fullName?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  location?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  githubUrl?: string;

  @Prop()
  portfolioUrl?: string;

  @Prop()
  summary?: string;

  // Experience
  @Prop({
    type: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      location: String,
      description: String,
      highlights: [String],
    }],
  })
  experience: Array<{
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    location: string;
    description: string;
    highlights: string[];
  }>;

  // Education
  @Prop({
    type: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: String,
    }],
  })
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: Date;
    endDate?: Date;
    gpa?: string;
  }>;

  // Skills
  @Prop({ type: [{ name: String, level: String, years: Number }] })
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years: number;
  }>;

  // Projects
  @Prop({
    type: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      highlights: [String],
    }],
  })
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    highlights: string[];
  }>;

  // Certifications
  @Prop({ type: [{ name: String, issuer: String, date: Date, url: String }] })
  certifications: Array<{
    name: string;
    issuer: string;
    date: Date;
    url?: string;
  }>;

  // Languages
  @Prop({ type: [{ language: String, proficiency: String }] })
  languages: Array<{
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;

  // ATS Optimization
  @Prop({ default: 0 })
  atsScore: number;

  @Prop({ type: [String] })
  keywords: string[];

  @Prop({ type: [String] })
  missingKeywords: string[];

  // File Storage
  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileSize?: number;

  // Versioning
  @Prop({ default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId })
  parentVersion?: Types.ObjectId;

  // AI Analysis
  @Prop({ type: Object })
  aiAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overallScore: number;
  };

  @Prop({ type: [{ jobId: Types.ObjectId, tailoredAt: Date, matchScore: Number }] })
  tailoredForJobs: Array<{
    jobId: Types.ObjectId;
    tailoredAt: Date;
    matchScore: number;
  }>;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  publicSlug?: string;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);

// Indexes
ResumeSchema.index({ userId: 1, status: 1 });
ResumeSchema.index({ userId: 1, isPublic: 1 });
ResumeSchema.index({ publicSlug: 1 }, { unique: true, sparse: true });
ResumeSchema.index({ atsScore: 1 });

// Virtual for experience duration
ResumeSchema.virtual('totalExperience').get(function () {
  if (!this.experience || this.experience.length === 0) return 0;
  
  const now = new Date();
  let totalMonths = 0;
  
  for (const exp of this.experience) {
    const start = new Date(exp.startDate);
    const end = exp.current ? now : new Date(exp.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }
  
  return Math.round(totalMonths / 12 * 10) / 10; // Return years with 1 decimal
});
