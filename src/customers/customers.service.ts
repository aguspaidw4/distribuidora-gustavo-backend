import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Customer } from './entities/customer.entity';

import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async getAccountsSummary() {

  const result =
    await this.customersRepository
      .createQueryBuilder('customer')

      .leftJoin(
        'customer.orders',
        'order',
      )

      .select(
        'customer.id',
        'customerId',
      )

      .addSelect(
        'customer.name',
        'customerName',
      )

      .addSelect(
        'COUNT(order.id)',
        'totalOrders',
      )

      .addSelect(
        'SUM(order.total)',
        'totalSpent',
      )

      .addSelect(
        'SUM(order.pendingAmount)',
        'totalPending',
      )

      .groupBy('customer.id')

      .getRawMany();

  return result.map((item) => ({
    ...item,

    totalOrders:
      Number(item.totalOrders) || 0,

    totalSpent:
      Number(item.totalSpent) || 0,

    totalPending:
      Number(item.totalPending) || 0,
  }));
}

  create(createCustomerDto: CreateCustomerDto) {
    const customer =
      this.customersRepository.create(
        createCustomerDto,
      );

    return this.customersRepository.save(customer);
  }

  findAll() {
    return this.customersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  findOne(id: number) {
    return this.customersRepository.findOne({
      where: { id },
    });
  }
}