import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  create(dto: CreateSupplierDto) {
    const supplier = this.suppliersRepository.create(dto);
    return this.suppliersRepository.save(supplier);
  }

  findAll() {
    return this.suppliersRepository.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const supplier = await this.suppliersRepository.findOne({
      where: { id },
    });
    if (!supplier) {
      throw new NotFoundException(`Proveedor #${id} no encontrado`);
    }
    return supplier;
  }

  async update(id: number, dto: Partial<CreateSupplierDto>) {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliersRepository.save(supplier);
  }

  async remove(id: number) {
    const supplier = await this.findOne(id);
    supplier.active = false;
    return this.suppliersRepository.save(supplier);
  }
}