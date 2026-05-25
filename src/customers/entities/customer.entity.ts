import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 120,
  })
  name: string;

  @Column({
    length: 50,
    nullable: true,
  })
  phone: string;

  @Column({
    nullable: true,
  })
  address: string;

  @Column({
    default: true,
  })
  active: boolean;

  @OneToMany(
    () => Order,
    (order) => order.customer,
  )
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;
}