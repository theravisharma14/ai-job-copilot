import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from '../../schemas/interview.schema';
import { InterviewController } from './controllers/interview.controller';
import { InterviewService } from './services/interview.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]),
    AiModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
