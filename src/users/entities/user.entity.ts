import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  CLIENT = 'CLIENT',
}

export enum TipoFiscal {
  CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
  MONOTRIBUTISTA = 'MONOTRIBUTISTA',
  RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OWNER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: TipoFiscal,
    nullable: true,
  })
  tipoFiscal: TipoFiscal | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  dni: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  cuit: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  domicilio: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  razonSocial: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  telefono: string | null;

  @CreateDateColumn()
  createdAt: Date;
}