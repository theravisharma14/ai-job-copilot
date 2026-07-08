import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  isPremium?: boolean;
}

export class BulkActionDto {
  @ApiProperty()
  @IsString()
  action: 'activate' | 'suspend' | 'ban' | 'delete';

  @ApiProperty({ type: [String] })
  userIds: string[];
}

export class FeatureFlagDto {
  @ApiProperty()
  @IsString()
  flagName: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional()
  @IsString()
  description?: string;
}
