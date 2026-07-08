import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { UpdateUserDto, BulkActionDto, FeatureFlagDto } from '../dtos/admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List all users with pagination' })
  findAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.findAllUsers(parseInt(page), parseInt(limit), { role, status, search });
  }

  @Get('users/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get user details' })
  findUserById(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  @Put('users/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/bulk-action')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Perform bulk action on users' })
  bulkAction(@Body() dto: BulkActionDto) {
    return this.adminService.bulkAction(dto);
  }

  @Get('feature-flags')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get all feature flags' })
  getAllFeatureFlags() {
    return this.adminService.getAllFeatureFlags();
  }

  @Post('feature-flags')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Set feature flag' })
  setFeatureFlag(@Body() dto: FeatureFlagDto) {
    return this.adminService.setFeatureFlag(dto);
  }

  @Get('health')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get system health status' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('suspicious-activity')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get suspicious activity reports' })
  getSuspiciousActivity() {
    return this.adminService.getSuspiciousActivity();
  }
}
