import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('recent-activity')
  recentActivity() {
    return this.dashboardService.recentActivity();
  }
}
