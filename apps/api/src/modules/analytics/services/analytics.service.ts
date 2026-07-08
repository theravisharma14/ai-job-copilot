import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsDaily, AnalyticsDailyDocument } from '../../schemas/analytics.schema';
import { User } from '../../schemas/user.schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsDaily.name) private analyticsModel: Model<AnalyticsDailyDocument>,
    @InjectModel(User.name) private userModel: Model<any>,
  ) {}

  async getDashboardStats(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalApplications, appliedToday, interviewRate, offerRate] = await Promise.all([
      this.getTotalApplications(userId),
      this.getApplicationsToday(userId, today),
      this.getInterviewRate(userId),
      this.getOfferRate(userId),
    ]);

    return {
      totalApplications,
      appliedToday,
      interviewRate,
      offerRate,
      resumeScore: await this.getResumeScore(userId),
      upcomingInterviews: await this.getUpcomingInterviews(userId),
    };
  }

  async getApplicationFunnel(userId: string): Promise<any> {
    const applications = await this.userModel.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'user',
          as: 'applications',
        },
      },
      { $unwind: '$applications' },
      {
        $group: {
          _id: '$applications.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const funnel = {
      wishlist: 0,
      saved: 0,
      applied: 0,
      assessment: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((item) => {
      if (funnel[item._id] !== undefined) {
        funnel[item._id] = item.count;
      }
    });

    return funnel;
  }

  async getWeeklyReport(userId: string): Promise<any> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dailyStats = await this.analyticsModel
      .find({
        user: userId,
        date: { $gte: weekAgo },
      })
      .sort({ date: 1 });

    return {
      applicationsPerDay: dailyStats.map((d) => ({
        date: d.date,
        count: d.applicationsCount,
      })),
      totalThisWeek: dailyStats.reduce((sum, d) => sum + d.applicationsCount, 0),
      avgApplicationsPerDay: Math.round(
        dailyStats.reduce((sum, d) => sum + d.applicationsCount, 0) / (dailyStats.length || 1),
      ),
    };
  }

  async recordApplication(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.analyticsModel.findOneAndUpdate(
      { user: userId, date: today },
      {
        $inc: { applicationsCount: 1 },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true, new: true },
    );
  }

  async recordInterview(userId: string, outcome: 'scheduled' | 'completed' | 'offer' | 'rejected'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const update: any = { lastUpdated: new Date() };
    if (outcome === 'scheduled') update.$inc = { interviewsScheduled: 1 };
    if (outcome === 'completed') update.$inc = { interviewsCompleted: 1 };
    if (outcome === 'offer') update.$inc = { offersReceived: 1 };
    if (outcome === 'rejected') update.$inc = { rejections: 1 };

    await this.analyticsModel.findOneAndUpdate(
      { user: userId, date: today },
      update,
      { upsert: true, new: true },
    );
  }

  private async getTotalApplications(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).populate('applications').exec();
    return user?.applications?.length || 0;
  }

  private async getApplicationsToday(userId: string, today: Date): Promise<number> {
    const stats = await this.analyticsModel.findOne({ user: userId, date: today }).exec();
    return stats?.applicationsCount || 0;
  }

  private async getInterviewRate(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.applications) return 0;

    const total = user.applications.length;
    if (total === 0) return 0;

    // This is simplified - in production, query applications collection
    return Math.round((total * 0.15) / total * 100); // Assume 15% interview rate
  }

  private async getOfferRate(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.applications) return 0;

    const total = user.applications.length;
    if (total === 0) return 0;

    return Math.round((total * 0.03) / total * 100); // Assume 3% offer rate
  }

  private async getResumeScore(userId: string): Promise<number> {
    // Simplified - would query resumes collection in production
    return 75;
  }

  private async getUpcomingInterviews(userId: string): Promise<number> {
    // Would query interviews collection in production
    return 2;
  }
}
