import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resume, ResumeDocument } from '../../database/schemas/resume.schema';
import { CreateResumeDto, UpdateResumeDto, TailorResumeDto, ParseResumeDto } from '../dto/resume.dto';
import { Job, JobDocument } from '../../database/schemas/job.schema';
import { AIService } from '../../ai/ai.service';

@Injectable()
export class ResumeService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private aiService: AIService,
  ) {}

  async create(userId: string, createResumeDto: CreateResumeDto): Promise<ResumeDocument> {
    const resume = await this.resumeModel.create({
      userId: new Types.ObjectId(userId),
      ...createResumeDto,
    });
    return resume;
  }

  async findAll(userId: string): Promise<ResumeDocument[]> {
    return this.resumeModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findOne(userId: string, id: string): Promise<ResumeDocument> {
    const resume = await this.resumeModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async update(userId: string, id: string, updateResumeDto: UpdateResumeDto): Promise<ResumeDocument> {
    const resume = await this.resumeModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      updateResumeDto,
      { new: true },
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.resumeModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Resume not found');
    }
  }

  async tailorResume(userId: string, resumeId: string, tailorDto: TailorResumeDto): Promise<{ tailoredResume: string; improvements: string[]; atsScore: number }> {
    const resume = await this.resumeModel.findOne({
      _id: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // Get job details
    const job = await this.jobModel.findById(tailorDto.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Convert resume to text format for AI processing
    const resumeText = this.formatResumeAsText(resume);

    // Use AI to tailor the resume
    const result = await this.aiService.tailorResume({
      resume: resumeText,
      jobDescription: job.description || '',
      companyName: job.company,
      tone: tailorDto.tone,
    });

    // Update resume with tailored version
    resume.content = result.tailoredResume;
    resume.atsScore = result.atsScore;
    resume.tailoredForJobs.push({
      jobId: new Types.ObjectId(tailorDto.jobId),
      tailoredAt: new Date(),
      matchScore: result.atsScore,
    });

    await resume.save();

    return result;
  }

  async calculateAtsScore(resumeId: string, jobDescription: string): Promise<{ score: number; missingKeywords: string[]; suggestions: string[] }> {
    const resume = await this.resumeModel.findById(resumeId);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const resumeText = this.formatResumeAsText(resume);

    // Use AI to analyze and score
    const result = await this.aiService.matchJobToResume({
      resume: resumeText,
      jobDescription,
    });

    return {
      score: result.score,
      missingKeywords: result.skillMatch.missing,
      suggestions: result.recommendations,
    };
  }

  async parseResume(dto: ParseResumeDto): Promise<Partial<CreateResumeDto>> {
    // Use AI to parse resume text
    const prompt = `
Parse the following resume text and extract structured information.

RESUME TEXT:
${dto.text}

OUTPUT FORMAT (JSON):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "summary": "",
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "bullets": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "graduationDate": "",
      "gpa": ""
    }
  ],
  "skills": [],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "link": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ]
}
`;

    const result = await this.aiService.complete(prompt, {
      systemPrompt: 'You are an expert resume parser. Extract information accurately.',
    });

    try {
      return JSON.parse(result.content);
    } catch {
      throw new BadRequestException('Failed to parse resume');
    }
  }

  async exportToPdf(resumeId: string): Promise<Buffer> {
    const resume = await this.resumeModel.findById(resumeId);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // TODO: Implement PDF generation using a library like pdfkit or puppeteer
    // For now, return a placeholder
    return Buffer.from('PDF content placeholder');
  }

  private formatResumeAsText(resume: ResumeDocument): string {
    let text = `${resume.personalInfo?.fullName || ''}\n`;
    text += `${resume.personalInfo?.email || ''} | ${resume.personalInfo?.phone || ''} | ${resume.personalInfo?.location || ''}\n\n`;
    
    if (resume.summary) {
      text += `SUMMARY:\n${resume.summary}\n\n`;
    }

    if (resume.experience?.length) {
      text += 'EXPERIENCE:\n';
      resume.experience.forEach(exp => {
        text += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n`;
        exp.bullets?.forEach(bullet => {
          text += `  - ${bullet}\n`;
        });
        text += '\n';
      });
    }

    if (resume.education?.length) {
      text += 'EDUCATION:\n';
      resume.education.forEach(edu => {
        text += `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})\n`;
      });
      text += '\n';
    }

    if (resume.skills?.length) {
      text += `SKILLS: ${resume.skills.join(', ')}\n\n`;
    }

    if (resume.projects?.length) {
      text += 'PROJECTS:\n';
      resume.projects.forEach(proj => {
        text += `${proj.name}: ${proj.description}\n`;
      });
    }

    return text;
  }
}
