import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';

import { CreateProductDto } from './dto/create-product.dto';

import { NotFoundException } from '@nestjs/common';

import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {

    const salePrice =
      createProductDto.purchasePrice *
      (1 + createProductDto.profitMargin / 100);

    const product = this.productsRepository.create({
      ...createProductDto,

      salePrice,
    });

    return this.productsRepository.save(product);
  }

  findAll() {
    return this.productsRepository.find();
  }

  findOne(id: number) {
    return this.productsRepository.findOne({
      where: { id },
    });
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    if (!product) {
      return null;
    }

    return this.productsRepository.remove(product);
  }
  
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.findOne(id);

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    Object.assign(product, updateProductDto);

    // recalcular precio venta
    if (
      updateProductDto.purchasePrice !== undefined ||
      updateProductDto.profitMargin !== undefined
    ) {
      product.salePrice =
        Number(product.purchasePrice) *
        (1 + Number(product.profitMargin) / 100);
    }

    return this.productsRepository.save(product);
  }

}