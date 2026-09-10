import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateGroupDto } from './dto/request/create-group.dto.js';
import { GroupResponse } from './dto/response/group-response.dto.js';
import { InviteResponse } from './dto/response/invite-response.dto.js';
import { UserResponse } from '../users/dto/response/user-response.dto.js';
import { parseUserType } from '../../helpers/parse-user-type.js';
import { ActivityResponse } from '../activities/dto/response/activity-response.dto.js';
import { parseActivityType } from '../../helpers/parse_activity_type.js';
import { parseGroupMemberType } from '../../helpers/parse-group-member-type.js';
import { UpdateGroupDto } from './dto/request/update-group-.dto.js';
import { parseGroupType } from '../../helpers/parse-group-type.js';

@Injectable()
export class GroupsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private async isUserInGroup(id: string, user: string) {
    const { data: isUserInGroup, error: isUserInGroupError } =
      await this.supabase
        .from('group_members')
        .select('admin')
        .eq('group_id', id)
        .eq('user_id', user)
        .single();

    if (isUserInGroupError) throw new Error(isUserInGroupError.message);
    if (!isUserInGroup) throw new UnauthorizedException();

    return isUserInGroup;
  }

  private async isUserGroupAdmin(id: string, user: string) {
    const isAdmin = await this.isUserInGroup(id, user);

    if (!isAdmin) throw new UnauthorizedException();
  }

  async getGroups(user: string) {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user);

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException();

    const members: String[] = [];
    data.map((m) => members.push(m.group_id));

    const { data: groupData, error: groupError } = await this.supabase
      .from('vw_groups')
      .select('*')
      .in('id', members);

    if (groupError) throw new Error(groupError.message);

    const groups: GroupResponse[] = [];

    groupData.map((d) => groups.push(parseGroupType(d)));

    return groups;
  }

  async getGroupById(id: string, user: string) {
    await this.isUserInGroup(id, user);

    const { data, error } = await this.supabase
      .from('vw_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return parseGroupType(data);
  }

  async getGroupMembers(id: string, user: string) {
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
      .from('vw_group_members')
      .select('*')
      .in('id', memberIds)
      .eq('group_id', id);

    if (error) throw new Error(error.message);

    const members: UserResponse[] = [];
    data.map((d) => members.push(parseGroupMemberType(d)));

    return members;
  }

  async getGroupActivities(id: string, user: string) {
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

  async inviteToGroup(group_id: string, users_to_add: string[], user: string) {
    const { data: isUserAdmin, error: isUserAdminError } = await this.supabase
      .from('group_members')
      .select('admin')
      .eq('user_id', user)
      .eq('admin', true)
      .eq('group_id', group_id);

    if (isUserAdminError) throw new Error(isUserAdminError.message);

    if (!isUserAdmin) throw new UnauthorizedException();

    const invites: { user_id: string; group_id: string; inviter: string }[] =
      [];

    users_to_add.map((u) =>
      invites.push({ user_id: u, group_id, inviter: user }),
    );

    const { error } = await this.supabase.from('group_invites').insert(invites);

    if (error && error.code !== '23505') throw new Error(error.message);
  }

  async createGroup(
    body: CreateGroupDto,
    user: string,
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
      .insert({ user_id: user, group_id: data.id, admin: true });

    if (adminInsertError) throw new Error(adminInsertError.message);

    const members: {
      user_id: string;
      group_id: string;
      inviter: string;
    }[] = [];

    if (body.members)
      body.members.map((m) => {
        members.push({ user_id: m, group_id: data.id, inviter: user });
      });

    const { error: inviterError } = await this.supabase
      .from('group_invites')
      .insert(members);

    if (inviterError) {
      await this.supabase.from('groups').delete().eq('id', data.id);
      throw new Error(inviterError.message);
    }

    return parseGroupType(data);
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

  async acceptInvite(invite_id: string, user: string) {
    const { data, error } = await this.supabase
      .from('group_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('responded', false)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new BadRequestException();

    if (data.user_id != user) throw new UnauthorizedException();

    const { error: joinError } = await this.supabase
      .from('group_members')
      .insert({
        user_id: user,
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

  async denyInvite(invite_id: string, user: string) {
    const { data, error } = await this.supabase
      .from('group_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('responded', false)
      .single();

    if (error) throw new Error(error.message);

    if (data.user_id != user) throw new UnauthorizedException();

    const { error: denyError } = await this.supabase
      .from('group_invites')
      .update({
        responded: true,
      })
      .eq('id', invite_id);

    if (denyError) throw new Error(denyError.message);
  }

  async updateGroupMembersRole(
    group: string,
    members: string[],
    self: string,
    admin: boolean,
  ) {
    await this.isUserGroupAdmin(group, self);

    if (members.includes(self))
      throw new BadRequestException('Cannot promote or demote yourself');

    const { data, error } = await this.supabase
      .from('group_members')
      .update({
        admin,
      })
      .eq('group_id', group)
      .in('user_id', members)
      .select('*');

    if (error) throw new Error(error.message);

    if (!data || data.length < members.length) {
      const { error: rollbackError } = await this.supabase
        .from('group_members')
        .update({
          admin: false,
        })
        .eq('group_id', group)
        .in('user_id', members);

      if (rollbackError) throw new Error(rollbackError.message);

      throw new BadRequestException('All users passed must be in the group');
    }
  }

  async updateGroup(group: string, self: string, body: UpdateGroupDto) {
    await this.isUserGroupAdmin(group, self);

    const { data, error } = await this.supabase
      .from('groups')
      .update(body)
      .eq('id', group)
      .select('*')
      .maybeSingle();

    if (error || !data) throw new BadRequestException();

    return parseGroupType(data);
  }
}
