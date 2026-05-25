import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { OrderDetail } from './order-detail.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    default: 'PENDING',
  })
  status: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total: number;

  @OneToMany(
    () => OrderDetail,
    (detail) => detail.order,
    {
      cascade: true,
    },
  )
  details: OrderDetail[];

  @CreateDateColumn()
  createdAt: Date;
}