import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.usersService.createUser(body);
  }
}
