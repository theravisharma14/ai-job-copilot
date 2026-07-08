import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from '../../database/schemas/application.schema';
import { Job, JobDocument } from '../../database/schemas/job.schema';
import { Resume, ResumeDocument } from '../../database/schemas/resume.schema';
import { CreateApplicationDto, UpdateApplicationDto, MoveApplicationDto, AutoApplyDto } from './dto/application.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectQueue('auto-apply') private autoApplyQueue: Queue,
  ) {}

  async create(userId: string, createDto: CreateApplicationDto): Promise<ApplicationDocument> {
    // Verify job exists
    const job = await this.jobModel.findById(createDto.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify resume exists
    const resume = await this.resumeModel.findOne({
      _id: new Types.ObjectId(createDto.resumeId),
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const application = await this.applicationModel.create({
      userId: new Types.ObjectId(userId),
      jobId: new Types.ObjectId(createDto.jobId),
      resumeId: new Types.ObjectId(createDto.resumeId),
      status: createDto.status || 'wishlist',
      source: createDto.source || 'manual',
      notes: createDto.notes,
    });

    return application.populate('jobId');
  }

  async findAll(userId: string, status?: string): Promise<ApplicationDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (status) {
      query.status = status;
    }

    return this.applicationModel.find(query)
      .populate('jobId')
      .populate('resumeId')
      .sort({ createdAt: -1 });
  }

  async findOne(userId: string, id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).populate('jobId').populate('resumeId');

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async update(userId: string, id: string, updateDto: UpdateApplicationDto): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      updateDto,
      { new: true },
    ).populate('jobId').populate('resumeId');

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async moveStatus(userId: string, id: string, moveDto: MoveApplicationDto): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Track status change in history
    application.statusHistory.push({
      fromStatus: application.status,
      toStatus: moveDto.status,
      changedAt: new Date(),
      notes: moveDto.notes,
    });

    application.status = moveDto.status;

    // Set appliedAt when moving to applied status
    if (moveDto.status === 'applied' && !application.appliedAt) {
      application.appliedAt = new Date();
    }

    await application.save();
    return application.populate('jobId');
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.applicationModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Application not found');
    }
  }

  async queueAutoApply(userId: string, autoApplyDto: AutoApplyDto): Promise<{ jobId: string; queueId: string }> {
    // Verify job and resume exist
    const [job, resume] = await Promise.all([
      this.jobModel.findById(autoApplyDto.jobId),
      this.resumeModel.findOne({
        _id: new Types.ObjectId(autoApplyDto.resumeId),
        userId: new Types.ObjectId(userId),
      }),
    ]);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // Create application record
    const application = await this.applicationModel.create({
      userId: new Types.ObjectId(userId),
      jobId: new Types.ObjectId(autoApplyDto.jobId),
      resumeId: new Types.ObjectId(autoApplyDto.resumeId),
      status: 'applied',
      source: 'auto_apply',
      isAutoApplied: true,
    });

    // Add to auto-apply queue
    const jobData = {
      applicationId: application.id,
      userId,
      jobId: autoApplyDto.jobId,
      resumeId: autoApplyDto.resumeId,
      coverLetterId: autoApplyDto.coverLetterId,
      customFields: autoApplyDto.customFields,
    };

    const queuedJob = await this.autoApplyQueue.add('auto-apply', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return { jobId: autoApplyDto.jobId, queueId: queuedJob.id };
  }

  async getStatistics(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    appliedToday: number;
    interviewRate: number;
    offerRate: number;
  }> {
    const applications = await this.applicationModel.find({
      userId: new Types.ObjectId(userId),
    });

    const byStatus: Record<string, number> = {};
    let appliedToday = 0;
    let interviewCount = 0;
    let offerCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const app of applications) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;

      if (app.appliedAt && app.appliedAt >= today) {
        appliedToday++;
      }

      if (app.status === 'interview') {
        interviewCount++;
      }

      if (app.status === 'offer') {
        offerCount++;
      }
    }

    const total = applications.length;
    const appliedTotal = byStatus['applied'] || 0;

    return {
      total,
      byStatus,
      appliedToday,
      interviewRate: appliedTotal > 0 ? Math.round((interviewCount / appliedTotal) * 100) : 0,
      offerRate: appliedTotal > 0 ? Math.round((offerCount / appliedTotal) * 100) : 0,
    };
  }
}
