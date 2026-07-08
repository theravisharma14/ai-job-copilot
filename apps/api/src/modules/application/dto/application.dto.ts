import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsObject, IsBoolean } from 'class-validator';

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

export enum ApplicationSource {
  MANUAL = 'manual',
  AUTO_APPLY = 'auto_apply',
  CHROME_EXTENSION = 'chrome_extension',
  API = 'api',
}

export class InterviewRoundDto {
  @ApiProperty()
  @IsString()
  type: 'phone' | 'technical' | 'onsite' | 'video';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AutoApplyLogDto {
  @ApiProperty()
  @IsString()
  step: string;

  @ApiProperty()
  @IsString()
  status: 'success' | 'failed' | 'pending';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  screenshotUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty()
  @IsString()
  timestamp: string;
}

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  resumeId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ApplicationSource)
  source?: ApplicationSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverLetterId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAutoApplied?: boolean;
}

export class UpdateApplicationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resumeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverLetterId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsObject()
  interviewRounds?: InterviewRoundDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appliedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  followUpDate?: string;
}

export class MoveApplicationDto {
  @ApiProperty()
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AutoApplyDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  resumeId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverLetterId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}
