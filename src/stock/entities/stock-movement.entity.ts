import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Product,
    (product) => product.stockMovements,
  )
  product: Product;

  @Column()
  quantity: number;

  @Column({
    length: 50,
  })
  type: string;

  @Column({
    nullable: true,
  })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}