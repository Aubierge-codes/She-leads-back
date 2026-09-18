import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('waste-by-type')
  wasteByType() {
    return this.analyticsService.wasteByType();
  }

  @Public()
  @Get('participants-by-status')
  participantsByStatus() {
    return this.analyticsService.participantsByStatus();
  }

  @Get('cleanup-events-by-status')
  cleanupEventsByStatus() {
    return this.analyticsService.cleanupEventsByStatus();
  }

  @Get('inventory-transactions-by-type')
  inventoryTransactionsByType() {
    return this.analyticsService.inventoryTransactionsByType();
  }

  @Get('reports-by-status')
  reportsByStatus() {
    return this.analyticsService.reportsByStatus();
  }

  @Get('donations-by-status')
  donationsByStatus() {
    return this.analyticsService.donationsByStatus();
  }
}
