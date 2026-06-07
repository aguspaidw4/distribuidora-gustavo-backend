import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IsInt, IsOptional } from 'class-validator';

class LinkUserDto {
  @IsOptional()
  @IsInt()
  userId: number | null;
}

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get('accounts')
  findAccountsSummary() {
    return this.customersService.getAccountsSummary();
  }

  // Pedidos del cliente logueado — usa el userId del token
  @Get('my-customer')
  findMyCustomer(@Request() req: any) {
    return this.customersService.findByUserId(req.user.userId);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCustomerDto>,
  ) {
    return this.customersService.update(id, dto);
  }

  // Vincular/desvincular usuario a cliente — solo ADMIN
  @Patch(':id/link-user')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  linkUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkUserDto,
  ) {
    return this.customersService.linkUser(id, dto.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}