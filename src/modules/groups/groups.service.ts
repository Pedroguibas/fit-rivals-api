import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateGroupDto } from './dto/request/create-group.dto.js';
import { PayloadDto } from '../auth/dto/payload.dto.js';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private async isUserInGroup(id: string, user: PayloadDto) {
    const { data: isUserInGroup, error: isUserInGroupError } =
      await this.supabase
        .from('group_members')
        .select('admin')
        .eq('group_id', id)
        .eq('user_id', user.sub)
        .single();

    if (isUserInGroupError) throw new Error(isUserInGroupError.message);
    if (!isUserInGroup) throw new UnauthorizedException();
  }

  async getGroups(user: PayloadDto) {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.sub);

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException();

    const members: String[] = [];
    data.map((m) => members.push(m.group_id));

    const { data: groupData, error: groupError } = await this.supabase
      .from('groups')
      .select('*')
      .in('id', members)
      .eq('deleted', false);

    if (groupError) throw new Error(groupError.message);

    return groupData;
  }

  async getGroupById(id: string, user: PayloadDto) {
    await this.isUserInGroup(id, user);

    const { data, error } = await this.supabase
      .from('vw_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async getGroupMembers(id: string, user: PayloadDto) {
    await this.isUserInGroup(id, user);

    const { data: membersData, error: membersError } = await this.supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', id)
      .eq('has_left', false);

    if (membersError) throw new Error(membersError.message);

    const memberIds: string[] = [];
    membersData.map((m) => memberIds.push(m.user_id));

    const { data, error } = await this.supabase
      .from('vw_users')
      .select('*')
      .in('id', memberIds);

    if (error) throw new Error(error.message);

    return data;
  }

  async getGroupActivities(id: string, user: PayloadDto) {
    await this.isUserInGroup(id, user);

    const { data, error } = await this.supabase
      .from('activity')
      .select('*')
      .eq('posted_on_group', id);

    if (error) throw new Error(error.message);

    return data;
  }

  async inviteToGroup(
    group_id: string,
    users_to_add: string[],
    user: PayloadDto,
  ) {
    const { data: isUserAdmin, error: isUserAdminError } = await this.supabase
      .from('group_members')
      .select('admin')
      .eq('user_id', user.sub)
      .eq('admin', true)
      .eq('group_id', group_id);

    if (isUserAdminError) throw new Error(isUserAdminError.message);

    if (!isUserAdmin) throw new UnauthorizedException();

    const invites: { user_id: string; group_id: string; inviter: string }[] =
      [];

    users_to_add.map((u) =>
      invites.push({ user_id: u, group_id, inviter: user.sub }),
    );

    const { error } = await this.supabase.from('group_invites').insert(invites);

    if (error && error.code !== '23505') throw new Error(error.message);
  }

  async createGroup(body: CreateGroupDto, user: PayloadDto) {
    const { data, error } = await this.supabase
      .from('groups')
      .insert({
        name: body.name,
        picture: body.picture,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    let members = [{ user_id: user.sub, group_id: data.id, admin: true }];

    if (body.members)
      body.members.map((m) => {
        members.push({ user_id: m, group_id: data.id, admin: false });
      });

    const { error: membersError } = await this.supabase
      .from('group_members')
      .insert(members);

    if (membersError) {
      await this.supabase.from('groups').delete().eq('id', data.id);
      throw new Error(membersError.message);
    }
  }

  async acceptInvite(invite_id: string, user: PayloadDto) {
    const { data, error } = await this.supabase
      .from('group_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('responded', false)
      .single();

    if (error) throw new Error(error.message);

    if (data.user_id != user.sub) throw new UnauthorizedException();

    const { error: joinError } = await this.supabase
      .from('group_members')
      .insert({
        user_id: user.sub,
        group_id: data.group_id,
        admin: false,
      });

    if (joinError) throw new Error(joinError.message);

    const { error: respond } = await this.supabase
      .from('group_invites')
      .update({
        accepted: true,
        responded: true,
      })
      .eq('id', invite_id);

    if (respond) throw new Error(respond.message);
  }

  async denyInvite(invite_id: string, user: PayloadDto) {
    const { data, error } = await this.supabase
      .from('group_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('responded', false)
      .single();

    if (error) throw new Error(error.message);

    if (data.user_id != user.sub) throw new UnauthorizedException();

    const { error: denyError } = await this.supabase
      .from('group_invites')
      .update({
        responded: true,
      })
      .eq('id', invite_id);

    if (denyError) throw new Error(denyError.message);
  }
}
