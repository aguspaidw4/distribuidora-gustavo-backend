import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OneToMany } from 'typeorm';

import { StockMovement } from '../../stock/entities/stock-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 150,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  purchasePrice: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 30,
  })
  profitMargin: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  salePrice: number;

  @Column({
    default: 0,
  })
  stock: number;

  @Column({
    default: true,
  })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => StockMovement,
    (movement) => movement.product,
  )
  stockMovements: StockMovement[];
}