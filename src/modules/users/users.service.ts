import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { compare, hash } from 'bcrypt';
import { UserResponse } from './dto/response/user-response.dto.js';
import { parseUserType } from '../../helpers/parse-user-type.js';
import { parseSelfUserType } from '../../helpers/parse-self-user-type.js';
import { SelfUserResponse } from './dto/response/self-user-response.dto.js';
import nodemailer, { Mail, SMTPSentMessageInfo } from 'nodemailer';
import { randomInt } from 'crypto';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import type { RedisClientType } from '@redis/client';
import { RestorePasswordCheckDto } from './dto/request/restore-password-check.dto.js';
import { UpdatePasswordDto } from './dto/request/update-password.dto.js';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dto/request/update-user.dto.js';

@Injectable()
export class UsersService {
  private mailer: Mail<SMTPSentMessageInfo>;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    private readonly configService: ConfigService,
  ) {
    this.mailer = nodemailer.createTransport({
      host: this.configService.get('MAILER_HOST'),
      port: this.configService.get('MAILER_PORT'),
      auth: {
        user: this.configService.get('MAILER_USER'),
        pass: this.configService.get('MAILER_PASS'),
      },
    });
  }

  private async massLogout(id: string) {
    await this.redis.del(id);
  }

  async getAllUsers() {
    const { data, error } = await this.supabase.from('vw_users').select();

    if (error) throw new Error(error.message);

    return data as UserResponse[];
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    return parseUserType(data);
  }

  async getSelf(id: string) {
    const { data, error } = await this.supabase
      .from('vw_self_user')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return parseSelfUserType(data);
  }

  async createUser(body: CreateUserDto): Promise<SelfUserResponse> {
    const hashed_password = await hash(body.password, 12);

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        name: body.name,
        email: body.email,
        username: body.username,
        password: hashed_password,
      })
      .select(
        `
        id,
        name,
        email,
        username,
        role,
        friend_code,
        picture,
        bio,
        streak,
        rank_rating,
        created_at
      `,
      )
      .single();

    if (error) throw new Error(error.message);

    return parseSelfUserType(data);
  }

  async deleteUser(id: string) {
    const { error } = await this.supabase
      .from('users')
      .update({
        deleted: true,
        deleted_at: new Date(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
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

  async updateUser(id: string, body: UpdateUserDto) {
    const { error } = await this.supabase
      .from('users')
      .update(body)
      .eq('id', id)
      .eq('deleted', false);

    if (error) throw new Error(error.message);
  }
}
