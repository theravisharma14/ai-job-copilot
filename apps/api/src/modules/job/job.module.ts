import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { Resume, ResumeSchema } from '../../database/schemas/resume.schema';
import { JobController } from './job.controller';
import { JobService } from './services/job.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Resume.name, schema: ResumeSchema },
    ]),
    AIModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
