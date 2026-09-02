import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { hash } from 'bcrypt';
import { UserResponse } from './dto/response/user-response.dto.js';
import { parseUserType } from '../../helpers/parse-user-type.js';

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

    return parseUserType(data);
  }

  async getSelf(id: string) {
    const { data, error } = await this.supabase
      .from('vw_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new UnauthorizedException();

    return parseUserType(data);
  }

  async createUser(body: CreateUserDto): Promise<UserResponse> {
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
      picture,
      bio,
      streak,
      rank_rating,
      created_at
    `,
      )
      .single();

    if (error) throw new Error(error.message);

    return parseUserType(data);
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
