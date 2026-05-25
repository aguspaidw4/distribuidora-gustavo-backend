import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { StockController } from './stock.controller';
import { StockService } from './stock.service';

import { StockMovement } from './entities/stock-movement.entity';

import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockMovement,
      Product,
    ]),
  ],

  controllers: [StockController],

  providers: [StockService],
})
export class StockModule {}