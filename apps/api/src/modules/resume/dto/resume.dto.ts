import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsBoolean, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum LanguageProficiency {
  BASIC = 'basic',
  CONVERSATIONAL = 'conversational',
  FLUENT = 'fluent',
  NATIVE = 'native',
}

export class ExperienceDto {
  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  current: boolean;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

export class EducationDto {
  @ApiProperty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsString()
  degree: string;

  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gpa?: string;
}

export class SkillDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SkillLevel })
  @IsEnum(SkillLevel)
  level: SkillLevel;

  @ApiProperty()
  @IsNumber()
  years: number;
}

export class ProjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  technologies: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

export class CertificationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  url?: string;
}

export class LanguageDto {
  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty({ enum: LanguageProficiency })
  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

export class CreateResumeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ type: [ExperienceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiProperty({ type: [EducationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiProperty({ type: [SkillDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiProperty({ type: [ProjectDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @ApiProperty({ type: [CertificationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({ type: [LanguageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];
}

export class UpdateResumeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ type: [ExperienceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiProperty({ type: [EducationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiProperty({ type: [SkillDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiProperty({ type: [ProjectDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @ApiProperty({ type: [CertificationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({ type: [LanguageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: 'draft' | 'active' | 'archived';
}

export class TailorResumeDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tone?: 'professional' | 'casual' | 'enthusiastic';
}
