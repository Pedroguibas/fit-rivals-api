import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { AdminGuard } from '../../guards/admin/admin.guard.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('self')
  async getSelf(@Req() req: AuthenticatedRequest) {
    return await this.usersService.getSelf(req.user.sub);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    return await this.usersService.createUser(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async deleteSelf(@Req() req: AuthenticatedRequest) {
    await this.usersService.deleteUser(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.usersService.deleteUser(id);
  }
}
