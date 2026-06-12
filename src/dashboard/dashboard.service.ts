import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Purchase } from '../purchases/entities/purchase.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,

    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
  ) {}

  async getSummary() {
    const salesResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalSales')
      .getRawOne();

    const totalOrders = await this.ordersRepository.count();
    const totalCustomers = await this.customersRepository.count();

    const lowStockProducts = await this.productsRepository.count({
      where: { stock: 0 },
    });

    const pendingPaymentsResult = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.pendingAmount)', 'pendingPayments')
      .getRawOne();

    const purchasesResult = await this.purchasesRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total)', 'totalPurchases')
      .getRawOne();

    return {
      totalSales: Number(salesResult.totalSales) || 0,
      totalOrders,
      totalCustomers,
      lowStockProducts,
      pendingPayments: Number(pendingPaymentsResult.pendingPayments) || 0,
      totalPurchases: Number(purchasesResult.totalPurchases) || 0,
    };
  }
}