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
import { GroupResponse } from './dto/response/group-response.dto.js';
import { InviteResponse } from './dto/response/invite-response.dto.js';
import { UserResponse } from '../users/dto/response/user-response.dto.js';
import { parseUserType } from '../../helpers/parse-user-type.js';
import { ActivityResponse } from '../activities/dto/response/activity-response.dto.js';
import { parseActivityType } from '../../helpers/parse_activity_type.js';

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
      .from('vw_groups')
      .select('*')
      .in('id', members);

    if (groupError) throw new Error(groupError.message);

    return groupData as GroupResponse[];
  }

  async getGroupById(id: string, user: PayloadDto) {
    await this.isUserInGroup(id, user);

    const { data, error } = await this.supabase
      .from('vw_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return data as GroupResponse;
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

    const members: UserResponse[] = [];
    data.map((d) => members.push(parseUserType(d)));

    return members;
  }

  async getGroupActivities(id: string, user: PayloadDto) {
    await this.isUserInGroup(id, user);

    const { data, error } = await this.supabase
      .from('vw_activities')
      .select('*')
      .eq('posted_on_group', id);

    if (error) throw new Error(error.message);

    const activities: ActivityResponse[] = [];

    const activitiesIds: string[] = [];

    data.map((d) => activitiesIds.push(d.id));

    const { data: participantsData, error: participantsError } =
      await this.supabase
        .from('activity_participants')
        .select('*')
        .in('activity_id', activitiesIds);

    if (participantsError) throw new Error(participantsError.message);

    const response: ActivityResponse[] = [];

    data.map((d) => {
      const group: GroupResponse = {
        id: d.group_id,
        name: d.group_name,
        picture: d.group_picture,
      };

      const participants: UserResponse[] = [];

      participantsData?.map((p) => {
        if (d.id === p.activity_id) participants.push(parseUserType(p));
      });

      response.push(parseActivityType(d, group, participants));
    });

    return response;
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

  async createGroup(
    body: CreateGroupDto,
    user: PayloadDto,
  ): Promise<GroupResponse> {
    const { data, error } = await this.supabase
      .from('groups')
      .insert({
        name: body.name,
        picture: body.picture,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const { error: adminInsertError } = await this.supabase
      .from('group_members')
      .insert({ user_id: user.sub, group_id: data.id, admin: true });

    if (adminInsertError) throw new Error(adminInsertError.message);

    const members: {
      user_id: string;
      group_id: string;
      inviter: string;
    }[] = [];

    if (body.members)
      body.members.map((m) => {
        members.push({ user_id: m, group_id: data.id, inviter: user.sub });
      });

    const { error: inviterError } = await this.supabase
      .from('group_invites')
      .insert(members);

    if (inviterError) {
      await this.supabase.from('groups').delete().eq('id', data.id);
      throw new Error(inviterError.message);
    }

    return {
      id: data.id,
      name: data.name,
      picture: data.picture,
    };
  }

  async getInvites(userId: string) {
    const { data, error } = await this.supabase
      .from('vw_invites')
      .select('*')
      .eq('invited_id', userId);

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    const invites: InviteResponse[] = [];

    data.map((d) =>
      invites.push({
        id: d.id,
        userId: d.invited_id,
        inviter: {
          id: d.inviter_id,
          name: d.inviter_name,
          email: d.inviter_email,
          username: d.inviter_username,
          picture: d.inviter_picture,
          bio: d.inviter_bio,
          streak: d.inviter_streak,
          rankRating: d.inviter_rank_rating,
          createdAt: d.inviter_created_at,
        },
        group: {
          id: d.group_id,
          name: d.group_name,
          picture: d.group_picture,
        },
      }),
    );

    return invites;
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
