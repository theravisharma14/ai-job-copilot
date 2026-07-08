import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true, select: false })
  password?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop({ select: false })
  resetPasswordToken?: string;

  @Prop({ select: false })
  resetPasswordExpires?: Date;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  twoFactorSecret?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ default: false })
  isLocked: boolean;

  @Prop()
  lockedUntil?: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: [{ provider: String, providerId: String }] })
  oauthAccounts: Array<{
    provider: 'google' | 'github' | 'linkedin';
    providerId: string;
  }>;

  @Prop({ default: 'free' })
  subscriptionTier: 'free' | 'pro' | 'enterprise';

  @Prop()
  subscriptionExpires?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: [] })
  preferences: string[];

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastActiveAt?: Date;

  // Virtuals
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  // Methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  async hashPassword(): Promise<void> {
    if (!this.password) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'oauthAccounts.provider': 1, 'oauthAccounts.providerId': 1 });
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ isActive: 1 });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    await this.hashPassword();
  }
  next();
});

// Virtual for user's full name
UserSchema.virtual('name').get(function () {
  return this.fullName;
});
