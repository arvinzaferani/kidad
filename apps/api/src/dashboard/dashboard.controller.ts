import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardActivityQueryDto } from './dto/dashboard-activity-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('activity')
  activity(@Query() query: DashboardActivityQueryDto) {
    return this.dashboardService.getRecentActivity(query.userId, query.limit ?? 5);
  }
}
