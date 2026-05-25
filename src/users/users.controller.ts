import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    const hashedPassword = await bcrypt.hash(
      body.password,
      10,
    );

    return this.usersService.create({
      email: body.email,
      name: body.name,
      password: hashedPassword,
    });
  }
}