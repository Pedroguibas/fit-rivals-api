import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRefreshRequest } from './types/authenticated-refresh-request.type.js';
import { RestorePasswordDto } from './dto/restore-password.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import type { AuthenticatedRequest } from './types/authenticated-request.type.js';
import { RestorePasswordCheckDto } from './dto/restore-password-check.dto.js';
import { RestorePasswordRequestDto } from './dto/restore-password-request.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRefreshRequest) {
    return await this.authService.refresh(req.user);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('logout')
  async logout(@Req() req: AuthenticatedRefreshRequest) {
    return await this.authService.logout(req.user);
  }

  @Post('password/restore/request')
  async requestToRestorePassword(@Body() body: RestorePasswordRequestDto) {
    await this.authService.restorePasswordRequest(body.email);
  }

  @Post('password/restore/check')
  async checkToRestorePassword(@Body() body: RestorePasswordCheckDto) {
    await this.authService.restorePasswordCheck(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    return await this.authService.updatePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('password/restore')
  async restorePassword(@Body() body: RestorePasswordDto) {
    await this.authService.restorePassword(body.email, body.password);
  }
}
