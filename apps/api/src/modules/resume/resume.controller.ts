import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseFilePipeBuilder, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ResumeService } from './services/resume.service';
import { CreateResumeDto, UpdateResumeDto, TailorResumeDto } from './dto/resume.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resume' })
  @ApiResponse({ status: 201, description: 'Resume created successfully' })
  async create(@Request() req, @Body() createResumeDto: CreateResumeDto) {
    return this.resumeService.create(req.user.sub, createResumeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for the current user' })
  @ApiResponse({ status: 200, description: 'List of resumes' })
  async findAll(@Request() req) {
    return this.resumeService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific resume' })
  @ApiResponse({ status: 200, description: 'Resume details' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.resumeService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resume' })
  @ApiResponse({ status: 200, description: 'Resume updated successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async update(@Request() req, @Param('id') id: string, @Body() updateResumeDto: UpdateResumeDto) {
    return this.resumeService.update(req.user.sub, id, updateResumeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  @ApiResponse({ status: 200, description: 'Resume deleted successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.resumeService.delete(req.user.sub, id);
  }

  @Post(':id/tailor')
  @ApiOperation({ summary: 'Tailor resume for a specific job' })
  @ApiResponse({ status: 200, description: 'Resume tailored successfully' })
  @ApiResponse({ status: 404, description: 'Resume or job not found' })
  async tailorResume(@Request() req, @Param('id') id: string, @Body() tailorDto: TailorResumeDto) {
    return this.resumeService.tailorResume(req.user.sub, id, tailorDto);
  }

  @Post('parse')
  @ApiOperation({ summary: 'Parse resume from uploaded file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Parsed resume data' })
  @UseInterceptors(FileInterceptor('file'))
  async parseResume(
    @Request() req,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(pdf|docx)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 }) // 5MB
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumeService.parseResumeFile(req.user.sub, file.buffer, file.originalname);
  }

  @Post(':id/ats-score')
  @ApiOperation({ summary: 'Calculate ATS score for a resume against a job description' })
  @ApiResponse({ status: 200, description: 'ATS score and suggestions' })
  async calculateAtsScore(@Request() req, @Param('id') id: string, @Body('jobDescription') jobDescription: string) {
    return this.resumeService.calculateAtsScore(id, jobDescription);
  }
}
