import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { StockMovement } from '../../stock/entities/stock-movement.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Categoría opcional — ej: "Medicamentos", "Limpieza", "Alimentos"
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  // Peso en gramos (opcional)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30 })
  profitMargin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePriceUnit: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePriceTira: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePriceCaja: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePriceUnit: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePriceTira: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePriceCaja: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice: number | null;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => StockMovement, (movement) => movement.product)
  stockMovements: StockMovement[];
}