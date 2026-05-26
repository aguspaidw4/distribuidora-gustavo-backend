import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';

import { ReportsService } from './reports.service';

import { OrderDetail } from '../orders/entities/order-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderDetail,
    ]),
  ],

  controllers: [ReportsController],

  providers: [ReportsService],
})
export class ReportsModule {}