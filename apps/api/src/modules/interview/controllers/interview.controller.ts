import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InterviewService } from '../services/interview.service';
import { CreateInterviewDto, SubmitInterviewAnswerDto } from '../dtos/interview.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new interview (mock or real)' })
  create(@CurrentUser() userId: string, @Body() dto: CreateInterviewDto) {
    return this.interviewService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all interviews for user' })
  @ApiQuery({ name: 'type', required: false, enum: ['mock', 'real'] })
  @ApiQuery({ name: 'status', required: false, enum: ['scheduled', 'completed', 'cancelled'] })
  findAll(
    @CurrentUser() userId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.interviewService.findAll(userId, { type, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific interview details' })
  findOne(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.interviewService.findOne(userId, id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit answer for interview question' })
  submitAnswer(
    @CurrentUser() userId: string,
    @Param('id') interviewId: string,
    @Body() dto: SubmitInterviewAnswerDto,
  ) {
    return this.interviewService.submitAnswer(userId, interviewId, dto);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate completed interview with AI' })
  evaluate(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.interviewService.evaluate(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an interview' })
  delete(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.interviewService.delete(userId, id);
  }
}
