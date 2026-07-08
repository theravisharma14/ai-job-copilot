import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Application, ApplicationSchema } from '../../database/schemas/application.schema';
import { Job, JobSchema } from '../../database/schemas/job.schema';
import { Resume, ResumeSchema } from '../../database/schemas/resume.schema';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './services/application.service';
import { AutoApplyProcessor } from './processors/auto-apply.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Resume.name, schema: ResumeSchema },
    ]),
    BullModule.registerQueue({
      name: 'auto-apply',
    }),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, AutoApplyProcessor],
  exports: [ApplicationService],
})
export class ApplicationModule {}
