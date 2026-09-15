import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import type { RedisClientType } from '@redis/client';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import { LoginDto } from './dto/login.dto.js';
import { compare, hash } from 'bcrypt';
import { PayloadDto } from './dto/payload.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { RefreshDto } from './dto/refresh.dto.js';
import { RestorePasswordCheckDto } from './dto/restore-password-check.dto.js';
import nodemailer, { Mail, SMTPSentMessageInfo } from 'nodemailer';

@Injectable()
export class AuthService {
  private refresh_secret: string;
  private access_secret: string;
  private mailer: Mail<SMTPSentMessageInfo>;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.refresh_secret = this.configService.getOrThrow('JWT_REFRESH_SECRET');
    this.access_secret = this.configService.getOrThrow('JWT_ACCESS_SECRET');

    this.mailer = nodemailer.createTransport({
      host: this.configService.get('MAILER_HOST'),
      port: this.configService.get('MAILER_PORT'),
      auth: {
        user: this.configService.get('MAILER_USER'),
        pass: this.configService.get('MAILER_PASS'),
      },
    });
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

    if (!data) throw new UnauthorizedException();

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

  async restorePasswordRequest(email: string) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return;

    const code = randomInt(100000, 999999).toString();

    await this.mailer.sendMail({
      from: '"FitRivals" <pedroguibas123@gmail.com>',
      to: email,
      subject: 'Recuperação de Senha',
      text: `Seu código de recuperação de senha é: ${code}. Ele expira em 10 minutos.`,
      html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333;">Recuperação de Senha</h2>
                <p>Olá, ${data.username ?? ''}</p>
                <p>Recebemos uma solicitação para redefinir a sua senha. Use o código abaixo para prosseguir:</p>
                <div style="background-color: #f4f4f4; text-align: center; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff; margin: 20px 0; border-radius: 4px;">
                    ${code}
                </div>
                <p style="font-size: 12px; color: #777;">Este código é válido por 10 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
            </div>
        `,
    });

    const encriptedCode = await hash(code, 12);

    await this.redis.set(`restore_password:${email}`, encriptedCode, {
      expiration: {
        type: 'EX',
        value: 600,
      },
    });
    await this.redis.del(`restore_password_tries:${email}`);
  }

  async restorePasswordCheck(body: RestorePasswordCheckDto) {
    const codeKey = `restore_password:${body.email}`;

    const checkCode = await this.redis.get(codeKey);

    if (!checkCode) throw new UnauthorizedException();

    const redisTriesKey = `restore_password_tries:${body.email}`;

    let redisTries = Number(await this.redis.get(redisTriesKey));

    const tries = redisTries ?? 0;

    if (tries > 4) throw new UnauthorizedException();

    const isValid = await compare(body.code, checkCode);

    if (!isValid) {
      await this.redis.incr(redisTriesKey);
      await this.redis.expire(redisTriesKey, 600);
      throw new UnauthorizedException();
    }
    await this.redis.del(codeKey);

    await this.redis.set(`can_restore_password:${body.email}`, 1, {
      expiration: {
        type: 'EX',
        value: 600,
      },
    });
  }

  async restorePassword(email: string, password: string) {
    const redisKey = `can_restore_password:${email}`;
    const canRestore = await this.redis.get(redisKey);

    if (!canRestore) throw new UnauthorizedException();

    const hashedPassword = await hash(password, 12);

    const { data, error } = await this.supabase
      .from('users')
      .update({
        password: hashedPassword,
      })
      .eq('email', email)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    await this.redis.del(redisKey);

    await this.massLogout(data.id);
  }

  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const { data, error: passwordError } = await this.supabase
      .from('users')
      .select('password')
      .eq('id', id)
      .eq('deleted', false)
      .maybeSingle();

    if (passwordError) throw new Error(passwordError.message);
    if (!data) throw new UnauthorizedException();

    const isCurrentCorrect = await compare(currentPassword, data.password);

    if (!isCurrentCorrect) throw new UnauthorizedException();

    const hashedPassword = await hash(newPassword, 12);

    const { error } = await this.supabase
      .from('users')
      .update({
        password: hashedPassword,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    await this.massLogout(id);
  }
}
