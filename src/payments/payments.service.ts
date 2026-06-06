import {
  Injectable,
  BadRequestException,
  NotFoundException,
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
    const order = await this.ordersRepository.findOne({
      where: { id: createDto.orderId },
    });

    if (!order) {
      throw new NotFoundException(
        `Pedido #${createDto.orderId} no encontrado`,
      );
    }

    const pending = Math.round(
      Number(order.pendingAmount) * 100,
    );

    const incoming = Math.round(
      createDto.amount * 100,
    );

    if (pending <= 0) {
      throw new BadRequestException(
        'Este pedido ya está completamente pagado',
      );
    }

    if (incoming > pending) {
      throw new BadRequestException(
        `El monto ingresado supera el pendiente del pedido. ` +
        `Pendiente: $${Number(order.pendingAmount).toFixed(2)}`,
      );
    }

    const payment = this.paymentsRepository.create({
      ...createDto,
      order,
    });

    // Actualizar totales usando centavos para evitar errores de punto flotante
    const newPaidCents =
      Math.round(Number(order.paidAmount) * 100) + incoming;

    const newPendingCents =
      Math.round(Number(order.total) * 100) - newPaidCents;

    order.paidAmount = newPaidCents / 100;
    order.pendingAmount = newPendingCents / 100;

    // Actualizar estado
    if (newPendingCents <= 0) {
      order.status = 'PAID';
      order.pendingAmount = 0;
    } else {
      order.status = 'PARTIAL';
    }

    await this.ordersRepository.save(order);

    return this.paymentsRepository.save(payment);
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