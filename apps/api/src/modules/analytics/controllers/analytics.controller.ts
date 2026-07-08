import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats(@CurrentUser() userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Get application funnel breakdown' })
  getApplicationFunnel(@CurrentUser() userId: string) {
    return this.analyticsService.getApplicationFunnel(userId);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly activity report' })
  getWeeklyReport(@CurrentUser() userId: string) {
    return this.analyticsService.getWeeklyReport(userId);
  }
}
