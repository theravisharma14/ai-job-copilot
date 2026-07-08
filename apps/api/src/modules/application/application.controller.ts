import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationService } from './services/application.service';
import { CreateApplicationDto, UpdateApplicationDto, MoveApplicationDto, AutoApplyDto } from './dto/application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  async create(@Request() req, @Body() createDto: CreateApplicationDto) {
    return this.applicationService.create(req.user.sub, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications with optional status filter' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.applicationService.findAll(req.user.sub, status);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({ status: 200, description: 'Application statistics' })
  async getStatistics(@Request() req) {
    return this.applicationService.getStatistics(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific application' })
  @ApiResponse({ status: 200, description: 'Application details' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.applicationService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateApplicationDto) {
    return this.applicationService.update(req.user.sub, id, updateDto);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move application to a different status (Kanban)' })
  @ApiResponse({ status: 200, description: 'Application status updated' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async moveStatus(@Request() req, @Param('id') id: string, @Body() moveDto: MoveApplicationDto) {
    return this.applicationService.moveStatus(req.user.sub, id, moveDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.applicationService.delete(req.user.sub, id);
  }

  @Post('auto-apply')
  @ApiOperation({ summary: 'Queue an auto-apply job' })
  @ApiResponse({ status: 200, description: 'Auto-apply queued successfully' })
  @ApiResponse({ status: 404, description: 'Job or resume not found' })
  async queueAutoApply(@Request() req, @Body() autoApplyDto: AutoApplyDto) {
    return this.applicationService.queueAutoApply(req.user.sub, autoApplyDto);
  }
}
