import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PlaywrightService } from './services/playwright.service';
import { AutoApplyProcessor } from '../application/processors/auto-apply.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'auto-apply',
    }),
  ],
  providers: [PlaywrightService, AutoApplyProcessor],
  exports: [PlaywrightService],
})
export class AutomationModule {}
