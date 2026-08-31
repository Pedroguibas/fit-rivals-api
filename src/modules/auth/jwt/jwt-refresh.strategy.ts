import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import checkEnvVaribale from '../../../helpers/check-env-variables.js';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { RedisClientType } from '@redis/client';
import { createHash } from 'crypto';
import { RefreshDto } from '../dto/refresh.dto.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.body?.refresh_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: checkEnvVaribale('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: { version: number; sub: string },
  ): Promise<RefreshDto> {
    const token = req.body.refresh_token;
    const hashed_token = createHash('sha256').update(token).digest('hex');

    const valid = await this.redis.hExists(
      payload.sub,
      `refresh:${hashed_token}`,
    );

    if (!valid) throw new UnauthorizedException();

    const version = await this.redis.get(`tokenVersion:${payload.sub}`);

    const tokenVersion = version ? Number(version) : 0;

    if (tokenVersion !== payload.version) throw new UnauthorizedException();

    return { ...payload, refresh_token: token };
  }
}
