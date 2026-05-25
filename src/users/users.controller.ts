import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return req.user;
  }
}