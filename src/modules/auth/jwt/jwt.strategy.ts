import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import checkEnvVaribale from '../../../helpers/check-env-variables.js';
import { PayloadDto } from '../dto/payload.dto.js';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { RedisClientType } from '@redis/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: checkEnvVaribale('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: PayloadDto) {
    const version = await this.redis.get(`tokenVersion:${payload.sub}`);

    const tokenVersion = version ? Number(version) : 0;

    if (payload.version !== tokenVersion) throw new UnauthorizedException();

    return payload;
  }
}
