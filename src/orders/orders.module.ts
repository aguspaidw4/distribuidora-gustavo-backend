import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';

import { Product } from '../products/entities/product.entity';

import { StockMovement } from '../stock/entities/stock-movement.entity';

import { CustomersModule } from '../customers/customers.module';

import { Customer } from '../customers/entities/customer.entity';
@Module({
  imports: [
    CustomersModule,
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      Product,
      StockMovement,    
      Customer,
    ]),
  ],

  controllers: [OrdersController],

  providers: [OrdersService],
})
export class OrdersModule {}