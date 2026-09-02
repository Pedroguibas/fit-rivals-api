import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { SupabaseClient, UserResponse } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { hash } from 'bcrypt';
import { PayloadDto } from '../auth/dto/payload.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

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

    return data as UserResponse;
  }

  async getSelf(id: string) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new UnauthorizedException();

    return data as UserResponse;
  }

  async createUser(body: CreateUserDto) {
    const hashed_password = await hash(body.password, 12);

    const { error } = await this.supabase.from('users').insert({
      name: body.name,
      email: body.email,
      username: body.username,
      password: hashed_password,
    });

    if (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  async deleteUser(id: string) {
    const { error } = await this.supabase
      .from('users')
      .update({
        deleted: true,
        deleted_at: Date.now(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
