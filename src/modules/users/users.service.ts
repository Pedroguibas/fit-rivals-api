import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getAllUsers() {
    const { data, error } = await this.supabase.from('vw_users').select();

    if (error) throw new Error(error.message);

    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select()
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException();

    return data;
  }

  async getSelf(id: string) {
    const { data, error } = await this.supabase
      .from('vw_self_user')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new UnauthorizedException();

    return data;
  }

  async createUser(body: CreateUserDto) {
    const hashed_password = await hash(body.password, 12);

    const { data, error } = await this.supabase.from('users').insert({
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
}
