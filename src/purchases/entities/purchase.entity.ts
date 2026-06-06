import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier: Supplier;

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

  @Column({ nullable: true })
  notes: string;

  @OneToMany(
    () => PurchaseDetail,
    (detail) => detail.purchase,
    { cascade: true },
  )
  details: PurchaseDetail[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('purchase_details')
export class PurchaseDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Purchase, (purchase) => purchase.details)
  purchase: Purchase;

  @Column()
  productId: number;

  @Column({ length: 150 })
  productName: string;

  @Column()
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitCost: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @Column({ default: false })
  updatePrice: boolean;
}