import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsDaily, AnalyticsDailySchema } from '../../schemas/analytics.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsDaily.name, schema: AnalyticsDailySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
