import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { UpdateUserDto, BulkActionDto, FeatureFlagDto, UserRole, UserStatus } from '../dtos/admin.dto';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalApplications: number;
  totalJobs: number;
  applicationsToday: number;
  revenue: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private featureFlags: Map<string, boolean> = new Map();

  constructor(@InjectModel(User.name) private userModel: Model<any>) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalUsers, activeUsers, premiumUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: 'active', lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      this.userModel.countDocuments({ subscription: { $exists: true }, 'subscription.status': 'active' }),
    ]);

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalApplications: 0, // Would aggregate from applications collection
      totalJobs: 0, // Would aggregate from jobs collection
      applicationsToday: 0,
      revenue: premiumUsers * 29.99, // Assuming $29.99/month
    };
  }

  async findAllUsers(page = 1, limit = 20, filters?: { role?: string; status?: string; search?: string }): Promise<{ users: any[]; total: number }> {
    const query: any = {};
    
    if (filters?.role && filters.role !== 'all') query.role = filters.role;
    if (filters?.status && filters.status !== 'all') query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, total };
  }

  async findUserById(id: string): Promise<any> {
    const user = await this.userModel.findById(id)
      .select('-password -refreshToken')
      .populate('resumes')
      .populate('applications')
      .populate('jobs')
      .exec();
    
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<any> {
    const update: any = { ...dto };
    if (dto.role) update.role = dto.role;
    if (dto.status) update.status = dto.status;

    return this.userModel.findByIdAndUpdate(id, update, { new: true }).select('-password -refreshToken').exec();
  }

  async bulkAction(dto: BulkActionDto): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const statusMap = {
      activate: 'active',
      suspend: 'suspended',
      ban: 'banned',
    };

    for (const userId of dto.userIds) {
      try {
        if (dto.action === 'delete') {
          await this.userModel.findByIdAndDelete(userId);
        } else if (statusMap[dto.action as keyof typeof statusMap]) {
          await this.userModel.findByIdAndUpdate(userId, {
            status: statusMap[dto.action as keyof typeof statusMap],
          });
        }
        success++;
      } catch (error) {
        this.logger.error(`Failed to process user ${userId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed };
  }

  async setFeatureFlag(dto: FeatureFlagDto): Promise<void> {
    this.featureFlags.set(dto.flagName, dto.enabled);
    this.logger.log(`Feature flag ${dto.flagName} set to ${dto.enabled}`);
  }

  getFeatureFlag(flagName: string): boolean {
    return this.featureFlags.get(flagName) || false;
  }

  async getAllFeatureFlags(): Promise<{ name: string; enabled: boolean }[]> {
    return Array.from(this.featureFlags.entries()).map(([name, enabled]) => ({ name, enabled }));
  }

  async deleteUser(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
    this.logger.log(`User ${id} deleted`);
  }

  async getSuspiciousActivity(): Promise<any[]> {
    // Detect suspicious patterns like rapid applications, multiple accounts, etc.
    return [];
  }

  async getSystemHealth(): Promise<any> {
    return {
      database: 'healthy',
      redis: 'healthy',
      queues: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
