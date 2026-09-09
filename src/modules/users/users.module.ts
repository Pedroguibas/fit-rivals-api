import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [SupabaseModule, RedisModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
