import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

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
    const result = await this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select('customer.id', 'customerId')
      .addSelect('customer.name', 'customerName')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.total)', 'totalSpent')
      .addSelect('SUM(order.pendingAmount)', 'totalPending')
      .groupBy('customer.id')
      .getRawMany();

    return result.map((item) => ({
      ...item,
      totalOrders: Number(item.totalOrders) || 0,
      totalSpent: Number(item.totalSpent) || 0,
      totalPending: Number(item.totalPending) || 0,
    }));
  }

  create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  findAll() {
    return this.customersRepository.find({
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
  }

  async findOne(id: number) {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: {
        user: true,
        orders: { details: { product: true } },
      },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente #${id} no encontrado`);
    }
    return customer;
  }

  // Buscar el cliente vinculado a un usuario
  async findByUserId(userId: number): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { userId },
      relations: { orders: { details: { product: true } } },
    });
  }

  async update(id: number, dto: Partial<CreateCustomerDto>) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customersRepository.save(customer);
  }

  // Vincular o desvincular un usuario a un cliente
  async linkUser(customerId: number, userId: number | null) {
    const customer = await this.findOne(customerId);

    // Verificar que el userId no esté ya vinculado a otro cliente
    if (userId !== null) {
      const existing = await this.customersRepository.findOne({
        where: { userId },
      });
      if (existing && existing.id !== customerId) {
        throw new BadRequestException(
          `Este usuario ya está vinculado al cliente "${existing.name}"`,
        );
      }
    }

    customer.userId = userId;
    return this.customersRepository.save(customer);
  }

  async remove(id: number) {
    const customer = await this.findOne(id);

    const hasOrders = await this.customersRepository
      .createQueryBuilder('customer')
      .innerJoin('customer.orders', 'order')
      .where('customer.id = :id', { id })
      .getCount();

    if (hasOrders > 0) {
      throw new BadRequestException(
        'No se puede eliminar un cliente que tiene pedidos asociados',
      );
    }

    return this.customersRepository.remove(customer);
  }
}