import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import type { RedisClientType } from '@redis/client';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import { LoginDto } from './dto/login.dto.js';
import { compare, hash } from 'bcrypt';
import { PayloadDto } from './dto/payload.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RefreshDto } from './dto/refresh.dto.js';

@Injectable()
export class AuthService {
  private refresh_secret: string;
  private access_secret: string;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.refresh_secret = this.configService.getOrThrow('JWT_REFRESH_SECRET');
    this.access_secret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
  }

  private async getTokenVersion(sub: string) {
    const version = await this.redis.get(`tokenVersion:${sub}`);
    return version ? Number(version) : 0;
  }

  private async generateTokens(payload: PayloadDto) {
    const access_token = this.jwt.sign(payload, {
      jwtid: crypto.randomUUID(),
      secret: this.access_secret,
      expiresIn: '15m',
    });

    const refresh_token = this.jwt.sign(
      {
        version: payload.version,
        sub: payload.sub,
      },
      {
        jwtid: crypto.randomUUID(),
        secret: this.refresh_secret,
        expiresIn: '30d',
      },
    );

    const hashed_token = createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    await this.redis.hSet(payload.sub, `refresh:${hashed_token}`, 1);
    await this.redis.hExpire(
      payload.sub,
      `refresh:${hashed_token}`,
      60 * 60 * 24 * 30,
    );

    return { access_token, refresh_token };
  }

  async login(credentials: LoginDto) {
    const { data, error } = await this.supabase
      .from('vw_auth')
      .select('*')
      .or(`email.eq.${credentials.user}, username.eq.${credentials.user}`)
      .maybeSingle();

    if (error) throw new Error();

    if (!data) throw new NotFoundException();

    const correct_password = await compare(credentials.password, data.password);

    if (!correct_password) throw new UnauthorizedException();

    const payload: PayloadDto = {
      version: await this.getTokenVersion(data.id),
      sub: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
    };

    return await this.generateTokens(payload);
  }

  async refresh(user: RefreshDto) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select('*')
      .eq('id', user.sub)
      .single();

    if (error || !data) throw new UnauthorizedException();

    const payload: PayloadDto = {
      version: await this.getTokenVersion(data.id),
      sub: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
    };

    const hashed_token = createHash('sha256')
      .update(user.refresh_token)
      .digest('hex');

    await this.redis.hDel(user.sub, `refresh:${hashed_token}`);

    return this.generateTokens(payload);
  }

  async logout(user: RefreshDto) {
    const hashed_token = createHash('sha256')
      .update(user.refresh_token)
      .digest('hex');

    await this.redis.hDel(user.sub, `refresh:${hashed_token}`);
  }

  async massLogout(sub: string) {
    await this.redis.incr(`tokenVersion:${sub}`);
    await this.redis.del(sub);
  }
}
