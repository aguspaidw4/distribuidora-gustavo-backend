import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, TipoFiscal } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

export class CreateUserDto {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  // Fiscales
  tipoFiscal?: TipoFiscal;
  apellido?: string;
  dni?: string;
  cuit?: string;
  domicilio?: string;
  razonSocial?: string;
  telefono?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  findAll() {
    return this.userRepository.find({
      select: {
        id: true,
        email: true,
        name: true,
        apellido: true,
        role: true,
        tipoFiscal: true,
        telefono: true,
        createdAt: true,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async countUsers(): Promise<number> {
    return this.userRepository.count();
  }

  async registerFirst(dto: CreateUserDto): Promise<User> {
    const count = await this.countUsers();
    if (count > 0) {
      throw new ForbiddenException(
        'Ya existe un administrador. Contactalo para crear tu cuenta.',
      );
    }
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    return this.userRepository.save(user);
  }

  async registerClient(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: UserRole.CLIENT,
      tipoFiscal: dto.tipoFiscal ?? null,
      apellido: dto.apellido ?? null,
      dni: dto.dni ?? null,
      cuit: dto.cuit ?? null,
      domicilio: dto.domicilio ?? null,
      razonSocial: dto.razonSocial ?? null,
      telefono: dto.telefono ?? null,
    });
    return this.userRepository.save(user);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.role ?? UserRole.OWNER,
    });
    return this.userRepository.save(user);
  }

  async updateRole(id: number, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  async removeUser(id: number): Promise<void> {
    const count = await this.countUsers();
    if (count <= 1) {
      throw new BadRequestException(
        'No se puede eliminar el único usuario del sistema',
      );
    }
    await this.userRepository.delete(id);
  }

  create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
}