import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, Min } from 'class-validator';

class RegisterPurchasePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(
    private readonly purchasesService: PurchasesService,
  ) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id);
  }

  @Post(':id/payment')
  registerPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterPurchasePaymentDto,
  ) {
    return this.purchasesService.registerPayment(id, dto.amount);
  }
}