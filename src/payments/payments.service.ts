import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Payment } from './entities/payment.entity';

import { Order } from '../orders/entities/order.entity';

import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,

    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async create(createDto: CreatePaymentDto) {

    const order =
      await this.ordersRepository.findOne({
        where: {
          id: createDto.orderId,
        },
      });

    if (!order) {
      throw new BadRequestException(
        'Order not found',
      );
    }

    if (
      Number(order.pendingAmount) <= 0
    ) {
      throw new BadRequestException(
        'Order already paid',
      );
    }

    if (
      createDto.amount >
      Number(order.pendingAmount)
    ) {
      throw new BadRequestException(
        'Payment exceeds pending amount',
      );
    }

    const payment =
      this.paymentsRepository.create({
        ...createDto,
        order,
      });

    // actualizar totales
    order.paidAmount =
      Number(order.paidAmount) +
      createDto.amount;

    order.pendingAmount =
      Number(order.total) -
      Number(order.paidAmount);

    // actualizar estado
    if (
      Number(order.pendingAmount) === 0
    ) {
      order.status = 'PAID';

    } else {

      order.status = 'PARTIAL';
    }

    await this.ordersRepository.save(order);

    return this.paymentsRepository.save(
      payment,
    );
  }

  findAll() {
    return this.paymentsRepository.find({
      relations: {
        order: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}