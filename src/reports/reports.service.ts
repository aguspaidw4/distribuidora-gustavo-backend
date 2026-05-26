import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OrderDetail } from '../orders/entities/order-detail.entity';

@Injectable()
export class ReportsService {
  constructor(

    @InjectRepository(OrderDetail)
    private orderDetailsRepository:
      Repository<OrderDetail>,
  ) {}

  async getTopProducts() {

    const result =
      await this.orderDetailsRepository
        .createQueryBuilder('detail')

        .leftJoin(
          'detail.product',
          'product',
        )

        .select(
          'product.id',
          'productId',
        )

        .addSelect(
          'product.name',
          'productName',
        )

        .addSelect(
          'SUM(detail.quantity)',
          'totalSold',
        )

        .groupBy('product.id')

        .orderBy(
          'totalSold',
          'DESC',
        )

        .limit(10)

        .getRawMany();

    return result.map((item) => ({
      ...item,

      totalSold:
        Number(item.totalSold) || 0,
    }));
  }
  async getSalesByDay() {

    const result =
        await this.orderDetailsRepository
        .manager

        .createQueryBuilder()

        .select(
            'DATE(order.createdAt)',
            'date',
        )

        .addSelect(
            'SUM(order.total)',
            'totalSales',
        )

        .from(
            'orders',
            'order',
        )

        .groupBy(
            'DATE(order.createdAt)',
        )

        .orderBy(
            'DATE(order.createdAt)',
            'ASC',
        )

        .getRawMany();

    return result.map((item) => ({
        ...item,

        totalSales:
        Number(item.totalSales) || 0,
    }));
    }
}