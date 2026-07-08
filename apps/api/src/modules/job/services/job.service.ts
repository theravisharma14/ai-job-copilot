import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../../database/schemas/job.schema';
import { CreateJobDto, SearchJobsDto, MatchJobDto } from './dto/job.dto';
import { Resume, ResumeDocument } from '../../database/schemas/resume.schema';
import { AIService } from '../../ai/ai.service';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    private aiService: AIService,
  ) {}

  async create(userId: string, createJobDto: CreateJobDto): Promise<JobDocument> {
    const job = await this.jobModel.create({
      userId: new Types.ObjectId(userId),
      ...createJobDto,
    });
    return job;
  }

  async findAll(userId: string, searchDto: SearchJobsDto): Promise<{ jobs: JobDocument[]; total: number }> {
    const query: any = {
      $or: [
        { userId: new Types.ObjectId(userId) },
        { isPublic: true },
      ],
    };

    if (searchDto.query) {
      query.$text = { $search: searchDto.query };
    }

    if (searchDto.location) {
      query.location = new RegExp(searchDto.location, 'i');
    }

    if (searchDto.workMode) {
      query.workMode = searchDto.workMode;
    }

    if (searchDto.jobType) {
      query.jobType = searchDto.jobType;
    }

    if (searchDto.experienceLevel) {
      query.experienceLevel = searchDto.experienceLevel;
    }

    if (searchDto.minSalary || searchDto.maxSalary) {
      query['salary.min'] = {};
      if (searchDto.minSalary) {
        query['salary.min'].$gte = searchDto.minSalary;
      }
      if (searchDto.maxSalary) {
        query['salary.max'].$lte = searchDto.maxSalary;
      }
    }

    if (searchDto.sources && searchDto.sources.length > 0) {
      query.source = { $in: searchDto.sources };
    }

    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    const sortField = searchDto.sortBy === 'date' ? 'postedDate' : 
                      searchDto.sortBy === 'salary' ? 'salary.max' : 'score';
    const sortOrder = searchDto.sortOrder === 'asc' ? 1 : -1;

    const [jobs, total] = await Promise.all([
      this.jobModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.jobModel.countDocuments(query),
    ]);

    return { jobs, total };
  }

  async findOne(userId: string, id: string): Promise<JobDocument> {
    const job = await this.jobModel.findOne({
      _id: new Types.ObjectId(id),
      $or: [
        { userId: new Types.ObjectId(userId) },
        { isPublic: true },
      ],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(userId: string, id: string, updateData: Partial<CreateJobDto>): Promise<JobDocument> {
    const job = await this.jobModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      updateData,
      { new: true },
    );

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.jobModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Job not found');
    }
  }

  async matchJob(userId: string, jobId: string, matchDto: MatchJobDto): Promise<{
    matchScore: number;
    skillGaps: Array<{ skill: string; required: boolean }>;
    reasons: string[];
    salaryEstimate?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    applicationPriority: 'high' | 'medium' | 'low';
  }> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const resume = await this.resumeModel.findOne({
      _id: new Types.ObjectId(matchDto.resumeId),
      userId: new Types.ObjectId(userId),
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // Format resume as text for AI processing
    const resumeText = this.formatResumeAsText(resume);

    // Use AI to match job with resume
    const result = await this.aiService.matchJobToResume({
      resume: resumeText,
      jobDescription: job.description || '',
      requiredSkills: job.requiredSkills,
    });

    return {
      matchScore: result.score,
      skillGaps: result.skillMatch.missing.map(skill => ({ skill, required: true })),
      reasons: result.reasons,
      salaryEstimate: result.salaryEstimate?.min,
      difficulty: result.score >= 80 ? 'easy' : result.score >= 50 ? 'medium' : 'hard',
      applicationPriority: result.applicationPriority,
    };
  }

  async saveJob(userId: string, jobId: string): Promise<JobDocument> {
    const job = await this.jobModel.findOneAndUpdate(
      { _id: new Types.ObjectId(jobId) },
      { 
        $addToSet: { savedBy: new Types.ObjectId(userId) },
        $set: { isSaved: true },
      },
      { new: true },
    );

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async unsaveJob(userId: string, jobId: string): Promise<JobDocument> {
    const job = await this.jobModel.findOneAndUpdate(
      { _id: new Types.ObjectId(jobId) },
      { 
        $pull: { savedBy: new Types.ObjectId(userId) },
      },
      { new: true },
    );

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getSavedJobs(userId: string): Promise<JobDocument[]> {
    return this.jobModel.find({
      savedBy: new Types.ObjectId(userId),
    }).sort({ savedAt: -1 });
  }

  private formatResumeAsText(resume: ResumeDocument): string {
    let text = `${resume.personalInfo?.fullName || ''}\n`;
    
    if (resume.summary) {
      text += `SUMMARY:\n${resume.summary}\n\n`;
    }

    if (resume.experience?.length) {
      text += 'EXPERIENCE:\n';
      resume.experience.forEach(exp => {
        text += `${exp.title} at ${exp.company}\n`;
        exp.bullets?.forEach(bullet => {
          text += `  - ${bullet}\n`;
        });
      });
      text += '\n';
    }

    if (resume.skills?.length) {
      text += `SKILLS: ${resume.skills.join(', ')}\n\n`;
    }

    return text;
  }
}
