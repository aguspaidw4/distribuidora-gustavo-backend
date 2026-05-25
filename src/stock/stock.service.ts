import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { StockMovement } from './entities/stock-movement.entity';

import { Product } from '../products/entities/product.entity';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private stockRepository: Repository<StockMovement>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(
    createDto: CreateStockMovementDto,
  ) {
    const product =
      await this.productsRepository.findOne({
        where: {
          id: createDto.productId,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    // actualizar stock
    switch (createDto.type) {

      case 'ENTRY':
      case 'PURCHASE':
      case 'ADJUSTMENT':
        product.stock += createDto.quantity;
        break;

      case 'EXIT':
      case 'SALE':
        product.stock -= createDto.quantity;
        break;
    }

    await this.productsRepository.save(product);

    const movement = this.stockRepository.create({
      quantity: createDto.quantity,

      type: createDto.type,

      reason: createDto.reason,

      product,
    });

    return this.stockRepository.save(movement);
  }

  findAll() {
    return this.stockRepository.find({
      relations: {
        product: true,
     },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}