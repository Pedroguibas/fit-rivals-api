import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt/jwt.strategy.js';
import { JwtRefreshStrategy } from './jwt/jwt-refresh.strategy.js';

@Module({
  imports: [SupabaseModule, RedisModule, JwtModule, ConfigModule],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
