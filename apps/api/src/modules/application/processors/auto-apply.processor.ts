import { Process, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from '../../database/schemas/application.schema';
import { PlaywrightService } from '../../automation/services/playwright.service';
import { Resume, ResumeDocument } from '../../database/schemas/resume.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';

@Processor('auto-apply')
export class AutoApplyProcessor {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private playwrightService: PlaywrightService,
  ) {}

  @Process('auto-apply')
  async handleAutoApply(job: Job<{
    applicationId: string;
    userId: string;
    jobId: string;
    resumeId: string;
    coverLetterId?: string;
    customFields?: Record<string, string>;
  }>) {
    const { applicationId, userId, jobId, resumeId, coverLetterId } = job.data;

    try {
      // Update application status to processing
      await this.applicationModel.findByIdAndUpdate(applicationId, {
        autoApplyStatus: 'processing',
      });

      // Get user data
      const user = await this.userModel.findById(userId);
      if (!user) throw new Error('User not found');

      // Get resume
      const resume = await this.resumeModel.findById(resumeId);
      if (!resume) throw new Error('Resume not found');

      // Get application with job details
      const application = await this.applicationModel.findById(applicationId).populate('job').exec();
      if (!application || !application.job) throw new Error('Application or job not found');

      const jobUrl = application.job.url;
      
      // Prepare user data for form filling
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        coverLetter: coverLetterId ? 'Cover letter content here' : '',
      };

      // Execute auto-apply with Playwright
      const result = await this.playwrightService.autoApply(
        { jobUrl },
        resume.fileUrl || '/tmp/resume.pdf',
        userData,
      );

      // Update application with result
      const updateData: any = {
        autoApplyStatus: result.status,
        autoApplyLogs: [
          { step: 'navigate', status: result.status === 'success' ? 'success' : 'failed', timestamp: new Date().toISOString() },
          { step: 'detect_ats', status: 'success', atsName: result.atsName, timestamp: new Date().toISOString() },
          { step: 'fill_form', status: result.status === 'success' ? 'success' : 'failed', timestamp: new Date().toISOString() },
          { step: 'submit', status: result.status, timestamp: new Date().toISOString() },
        ],
        screenshots: result.screenshots,
      };

      if (result.status === 'success') {
        updateData.appliedAt = result.completedAt;
        updateData.status = 'applied';
      } else if (result.error) {
        updateData.autoApplyError = result.error;
      }

      await this.applicationModel.findByIdAndUpdate(applicationId, updateData);

      return { success: result.status === 'success', applicationId, result };
    } catch (error) {
      // Update application with failure
      await this.applicationModel.findByIdAndUpdate(applicationId, {
        autoApplyStatus: 'failed',
        autoApplyError: error.message,
      });

      throw error;
    }
  }
}
