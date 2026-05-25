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