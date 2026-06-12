import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Purchase } from '../purchases/entities/purchase.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Customer, Purchase]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}