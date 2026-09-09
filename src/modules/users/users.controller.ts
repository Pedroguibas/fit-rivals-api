import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { AdminGuard } from '../../guards/admin/admin.guard.js';
import { UpdateUserDto } from './dto/request/update-user.dto.js';
import { UpdatePasswordDto } from './dto/request/update-password.dto.js';
import { RestorePasswordRequestDto } from './dto/request/restore-password-request.dto.js';
import { RestorePasswordCheckDto } from './dto/request/restore-password-check.dto.js';
import { RestorePasswordDto } from './dto/request/restore-password.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), AdminGuard)
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

  @Post('password/restore/request')
  async requestToRestorePassword(@Body() body: RestorePasswordRequestDto) {
    await this.usersService.restorePasswordRequest(body.email);
  }

  @Post('password/restore/check')
  async checkToRestorePassword(@Body() body: RestorePasswordCheckDto) {
    await this.usersService.restorePasswordCheck(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async deleteSelf(@Req() req: AuthenticatedRequest) {
    await this.usersService.deleteUser(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.usersService.deleteUser(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateUserDto,
  ) {
    if (
      !body ||
      !(body.name || body.email || body.bio || body.username || body.picture)
    )
      throw new BadRequestException();
    return await this.usersService.updateUser(req.user.sub, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    return await this.usersService.updatePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('password/restore')
  async restorePassword(@Body() body: RestorePasswordDto) {
    await this.usersService.restorePassword(body.email, body.password);
  }
}
