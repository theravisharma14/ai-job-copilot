import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobSource {
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  WELLFOUND = 'wellfound',
  NAUKRI = 'naukri',
  FOUNDIT = 'foundit',
  REMOTE_OK = 'remote_ok',
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  WORKDAY = 'workday',
  ASHBY = 'ashby',
  CUSTOM = 'custom',
}

export enum WorkMode {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

export enum ExperienceLevel {
  INTERN = 'intern',
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  VP = 'vp',
  CXO = 'cxo',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Job {
  @Prop({ required: true })
  externalId: string;

  @Prop({ required: true })
  source: JobSource;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop()
  companyLogo?: string;

  @Prop()
  location?: string;

  @Prop()
  country?: string;

  @Prop({ type: String, enum: WorkMode })
  workMode?: WorkMode;

  @Prop({ type: String, enum: ExperienceLevel })
  experienceLevel?: ExperienceLevel;

  @Prop()
  minExperience?: number; // years

  @Prop()
  maxExperience?: number; // years

  @Prop()
  salaryMin?: number;

  @Prop()
  salaryMax?: number;

  @Prop()
  salaryCurrency?: string;

  @Prop()
  salaryPeriod?: 'hourly' | 'monthly' | 'yearly';

  @Prop()
  description?: string;

  @Prop({ type: [String] })
  requirements?: string[];

  @Prop({ type: [String] })
  responsibilities?: string[];

  @Prop({ type: [String] })
  benefits?: string[];

  @Prop({ type: [String] })
  skills?: string[];

  @Prop()
  department?: string;

  @Prop()
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

  @Prop()
  applicationUrl?: string;

  @Prop()
  originalUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  postedDate?: Date;

  @Prop()
  expiryDate?: Date;

  @Prop({ type: Types.ObjectId })
  recruiterId?: Types.ObjectId;

  @Prop()
  recruiterName?: string;

  @Prop()
  recruiterEmail?: string;

  @Prop()
  hiringManagerName?: string;

  // AI Analysis
  @Prop({ type: Object })
  aiAnalysis?: {
    keywords: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    seniority: string;
    industry: string;
    techStack: string[];
    softSkills: string[];
  };

  // Matching
  @Prop({ default: 0 })
  matchScore?: number;

  @Prop({ type: [String] })
  matchedSkills?: string[];

  @Prop({ type: [String] })
  missingSkills?: string[];

  @Prop()
  difficulty?: 'easy' | 'medium' | 'hard' | 'very-hard';

  @Prop({ default: false })
  isVisaSponsored: boolean;

  @Prop({ default: 0 })
  applicantCount?: number;

  @Prop({ type: [{ userId: Types.ObjectId, savedAt: Date }] })
  savedBy: Array<{
    userId: Types.ObjectId;
    savedAt: Date;
  }>;

  @Prop({ type: [{ userId: Types.ObjectId, appliedAt: Date }] })
  appliedBy: Array<{
    userId: Types.ObjectId;
    appliedAt: Date;
  }>;

  // Scraping metadata
  @Prop()
  scrapedAt?: Date;

  @Prop()
  lastUpdated?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Indexes for efficient searching
JobSchema.index({ externalId: 1, source: 1 }, { unique: true });
JobSchema.index({ title: 'text', company: 'text', description: 'text' });
JobSchema.index({ skills: 'text' });
JobSchema.index({ location: 1, workMode: 1 });
JobSchema.index({ experienceLevel: 1 });
JobSchema.index({ salaryMin: 1, salaryMax: 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ isActive: 1, postedDate: -1 });
JobSchema.index({ 'savedBy.userId': 1 });
JobSchema.index({ 'appliedBy.userId': 1 });
JobSchema.index({ matchScore: -1 });

// Static method to calculate match score
JobSchema.statics.calculateMatchScore = function (job: any, skills: string[]): number {
  if (!job.skills || job.skills.length === 0) return 50;
  
  const matchedSkills = job.skills.filter(skill => 
    skills.some(userSkill => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );
  
  return Math.round((matchedSkills.length / job.skills.length) * 100);
};
