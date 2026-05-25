import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { StockService } from './stock.service';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
  ) {}

  @Post('movements')
  create(
    @Body()
    createDto: CreateStockMovementDto,
  ) {
    return this.stockService.create(createDto);
  }

  @Get('movements')
  findAll() {
    return this.stockService.findAll();
  }
}