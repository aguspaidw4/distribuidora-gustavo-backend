import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('top-products')
  getTopProducts() {
    return this.reportsService
      .getTopProducts();
  }

  @Get('sales-by-day')
  getSalesByDay() {
    return this.reportsService
        .getSalesByDay();
  }
}