import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Database
import { DatabaseModule } from './database/database.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ResumeModule } from './modules/resume/resume.module';
import { JobModule } from './modules/job/job.module';
import { ApplicationModule } from './modules/application/application.module';
import { InterviewModule } from './modules/interview/interview.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Queue (BullMQ) - configured in DatabaseModule
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      prefix: process.env.BULLMQ_PREFIX || 'jobcopilot',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    AuthModule,
    UserModule,
    ResumeModule,
    JobModule,
    ApplicationModule,
    InterviewModule,
    AnalyticsModule,
    AdminModule,
    NotificationModule,
    AIModule,
  ],
})
export class AppModule {}
