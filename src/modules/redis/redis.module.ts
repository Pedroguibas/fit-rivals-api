import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider.js';

@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}
