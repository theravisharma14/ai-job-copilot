import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from './services/job.service';
import { CreateJobDto, SearchJobsDto, MatchJobDto } from './dto/job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  async create(@Request() req, @Body() createJobDto: CreateJobDto) {
    return this.jobService.create(req.user.sub, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter jobs' })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  async findAll(@Request() req, @Query() searchDto: SearchJobsDto) {
    return this.jobService.findAll(req.user.sub, searchDto);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved jobs' })
  @ApiResponse({ status: 200, description: 'List of saved jobs' })
  async getSavedJobs(@Request() req) {
    return this.jobService.getSavedJobs(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job' })
  @ApiResponse({ status: 200, description: 'Job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.jobService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(@Request() req, @Param('id') id: string, @Body() updateData: Partial<CreateJobDto>) {
    return this.jobService.update(req.user.sub, id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.jobService.delete(req.user.sub, id);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Match job with resume' })
  @ApiResponse({ status: 200, description: 'Job match analysis' })
  @ApiResponse({ status: 404, description: 'Job or resume not found' })
  async matchJob(@Request() req, @Param('id') id: string, @Body() matchDto: MatchJobDto) {
    return this.jobService.matchJob(req.user.sub, id, matchDto);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a job' })
  @ApiResponse({ status: 200, description: 'Job saved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async saveJob(@Request() req, @Param('id') id: string) {
    return this.jobService.saveJob(req.user.sub, id);
  }

  @Delete(':id/unsave')
  @ApiOperation({ summary: 'Unsave a job' })
  @ApiResponse({ status: 200, description: 'Job unsaved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async unsaveJob(@Request() req, @Param('id') id: string) {
    return this.jobService.unsaveJob(req.user.sub, id);
  }
}
