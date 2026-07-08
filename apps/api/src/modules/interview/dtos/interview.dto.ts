import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InterviewType {
  MOCK = 'mock',
  REAL = 'real',
}

export enum InterviewCategory {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  SYSTEM_DESIGN = 'system_design',
  DSA = 'dsa',
  CODING = 'coding',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export class CreateInterviewDto {
  @ApiProperty({ enum: InterviewType })
  @IsEnum(InterviewType)
  type: InterviewType;

  @ApiProperty({ enum: InterviewCategory })
  @IsEnum(InterviewCategory)
  category: InterviewCategory;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  scheduledAt?: Date;
}

export class SubmitInterviewAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  answer: string;

  @ApiPropertyOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  timeSpent?: number;
}

export class InterviewQuestion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  category: InterviewCategory;

  @ApiProperty()
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional()
  expectedAnswer?: string;

  @ApiPropertyOptional()
  evaluationCriteria?: string[];
}

export class InterviewEvaluation {
  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  scores: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    confidence: number;
    clarity: number;
  };

  @ApiProperty()
  strengths: string[];

  @ApiProperty()
  weaknesses: string[];

  @ApiProperty()
  feedback: string;

  @ApiProperty()
  improvementTips: string[];

  @ApiProperty()
  recommendedResources: string[];
}
