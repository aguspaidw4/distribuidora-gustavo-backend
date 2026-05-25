import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity';

import { Product } from '../products/entities/product.entity';

import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class DashboardService {
  constructor(

    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async getSummary() {

    // ventas totales
    const salesResult =
      await this.ordersRepository
        .createQueryBuilder('order')

        .select(
          'SUM(order.total)',
          'totalSales',
        )

        .getRawOne();

    // total pedidos
    const totalOrders =
      await this.ordersRepository.count();

    // total clientes
    const totalCustomers =
      await this.customersRepository.count();

    // stock bajo
    const lowStockProducts =
      await this.productsRepository.count({
        where: {
          stock: 0,
        },
      });

    // pagos pendientes
    const pendingPaymentsResult =
      await this.ordersRepository
        .createQueryBuilder('order')

        .select(
          'SUM(order.pendingAmount)',
          'pendingPayments',
        )

        .getRawOne();

    return {
      totalSales:
        Number(
          salesResult.totalSales,
        ) || 0,

      totalOrders,

      totalCustomers,

      lowStockProducts,

      pendingPayments:
        Number(
          pendingPaymentsResult.pendingPayments,
        ) || 0,
    };
  }
}