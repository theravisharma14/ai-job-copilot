import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePreferences(userId: string, preferences: string[]): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getDashboardStats(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // These will be populated from other collections in a real implementation
    return {
      appliedToday: 0,
      interviewRate: 0,
      resumeScore: 0,
      upcomingInterviews: [],
      recentJobs: [],
      applicationTimeline: [],
    };
  }

  async verifyEmail(token: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      {
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: userId });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
