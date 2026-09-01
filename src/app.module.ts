import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SupabaseModule } from './modules/supabase/supabase.module.js';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './modules/redis/redis.module.js';
import { ActivitiesModule } from './modules/activities/activities.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'fit-rivals-api',
    }),
    UsersModule,
    GroupsModule,
    AuthModule,
    SupabaseModule,
    ConfigModule,
    RedisModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
