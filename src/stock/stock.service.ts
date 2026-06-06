import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  async create(createDto: CreateStockMovementDto) {
    const product =
      await this.productsRepository.findOne({
        where: { id: createDto.productId },
      });

    if (!product) {
      throw new NotFoundException(
        `Producto #${createDto.productId} no encontrado`,
      );
    }

    switch (createDto.type) {
      case 'ENTRY':
      case 'PURCHASE':
      case 'ADJUSTMENT':
        product.stock += createDto.quantity;
        break;

      case 'EXIT':
      case 'SALE':
        if (product.stock < createDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". ` +
            `Disponible: ${product.stock}, solicitado: ${createDto.quantity}`,
          );
        }
        product.stock -= createDto.quantity;
        break;

      default:
        throw new BadRequestException(
          `Tipo de movimiento inválido: ${createDto.type}`,
        );
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