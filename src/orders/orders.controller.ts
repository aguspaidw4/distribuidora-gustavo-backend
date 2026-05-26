import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { Response } from 'express';

import { Res } from '@nestjs/common';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  create(
    @Body()
    createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(
      createOrderDto,
    );
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }
  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: string,

    @Res() res: Response,
  ) {

    const pdfDoc =
      await this.ordersService
        .generatePdf(Number(id));

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pedido-${id}.pdf`,
    );

    pdfDoc.pipe(res);
  }
}