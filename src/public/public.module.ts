import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [AnalyticsModule],
  providers: [PublicService],
  controllers: [PublicController],
})
export class PublicModule {}
