import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string } }> {
    const existingUser = await this.userModel.findOne({ email: registerDto.email });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.userModel.create(registerDto);
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async login(loginDto: LoginDto): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await this.userModel.findOne({ email: loginDto.email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isLocked) {
      throw new Error('Account is locked. Please reset your password.');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    
    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await this.userModel.findById(payload.sub);
      
      if (!user) {
        throw new Error('User not found');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });
  }

  private async generateTokens(user: UserDocument): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'access' },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, type: 'refresh' },
        {
          secret: this.configService.get('REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    // Store refresh token hash in database
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  private async incrementFailedAttempts(user: UserDocument): Promise<void> {
    user.failedLoginAttempts += 1;
    
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'reset' },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '1h' },
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      }) as TokenPayload & { type: 'reset' };

      if (payload.type !== 'reset') {
        throw new Error('Invalid token type');
      }

      const user = await this.userModel.findOne({
        _id: payload.sub,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      await user.save();
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }
}
