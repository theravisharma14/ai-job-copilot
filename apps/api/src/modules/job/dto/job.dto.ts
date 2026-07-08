import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsBoolean, IsObject } from 'class-validator';

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

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
}

export enum WorkMode {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

export class SalaryRangeDto {
  @ApiProperty()
  @IsNumber()
  min: number;

  @ApiProperty()
  @IsNumber()
  max: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  period?: 'hourly' | 'monthly' | 'yearly';
}

export class CompanyInfoDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SkillMatchDto {
  @ApiProperty()
  @IsString()
  skill: string;

  @ApiProperty()
  @IsBoolean()
  matched: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  requiredLevel?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  userLevel?: number;
}

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  source: JobSource;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiProperty({ type: SalaryRangeDto, required: false })
  @IsOptional()
  @IsObject()
  salary?: SalaryRangeDto;

  @ApiProperty({ type: CompanyInfoDto })
  @IsObject()
  company: CompanyInfoDto;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postedDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  easyApply?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recruiterName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recruiterEmail?: string;
}

export class SearchJobsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(JobSource, { each: true })
  sources?: JobSource[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: 'relevance' | 'date' | 'salary';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class MatchJobDto {
  @ApiProperty()
  @IsString()
  resumeId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobDescription?: string;
}
