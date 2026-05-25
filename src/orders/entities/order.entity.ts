import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { OrderDetail } from './order-detail.entity';

import { ManyToOne } from 'typeorm';

import { Customer } from '../../customers/entities/customer.entity';

import { Payment } from '../../payments/entities/payment.entity';

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

  @Column({
  type: 'decimal',
  precision: 10,
  scale: 2,
  default: 0,
  })
  paidAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  pendingAmount: number;

  @OneToMany(
    () => OrderDetail,
    (detail) => detail.order,
    {
      cascade: true,
    },
    
  )
  details: OrderDetail[];

  @OneToMany(
    () => Payment,
    (payment) => payment.order,
  )
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(
    () => Customer,
    (customer) => customer.orders,
    {
      nullable: false,
    },
  )
  customer: Customer;
}