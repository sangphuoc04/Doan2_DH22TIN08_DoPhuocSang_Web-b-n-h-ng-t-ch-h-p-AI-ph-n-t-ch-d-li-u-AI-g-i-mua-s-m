import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('revenue')
  getRevenue() {
    return this.dashboardService.getRevenueStats();
  }

  @Get('customer-segments')
  getCustomerSegments() {
    return this.dashboardService.getCustomerSegments();
  }
}