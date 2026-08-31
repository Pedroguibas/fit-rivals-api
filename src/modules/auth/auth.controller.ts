import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import type { RefreshDto } from './dto/refresh.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRefreshRequest } from './types/authenticated-refresh-request.type.js';

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
}
