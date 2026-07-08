import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

// Schemas
import { User, UserSchema } from './schemas/user.schema';
import { Resume, ResumeSchema } from './schemas/resume.schema';
import { Job, JobSchema } from './schemas/job.schema';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { Analytics, AnalyticsSchema } from './schemas/analytics.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/jobcopilot-pro'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'jobcopilot-pro'),
        autoIndex: true,
        autoCreate: true,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('✅ MongoDB connected');
          });
          connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
          });
          connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    // User Schema
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Resume.name, schema: ResumeSchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),

    // BullMQ Queue Module
    BullModule.registerQueue(
      { name: 'resume-processing' },
      { name: 'job-search' },
      { name: 'auto-apply' },
      { name: 'email-notifications' },
      { name: 'ai-matching' },
      { name: 'interview-scheduling' },
    ),
  ],
  exports: [MongooseModule, BullModule],
})
export class DatabaseModule {}
