import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Order,
    {
      nullable: false,
    },
  )
  order: Order;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({
    length: 50,
  })
  method: string;

  @Column({
    nullable: true,
  })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;
}