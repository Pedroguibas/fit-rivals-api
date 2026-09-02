import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { PayloadDto } from '../auth/dto/payload.dto.js';
import { CreateActivityDto } from './dto/request/create-activity.dto.js';
import { CreateActivityTypeDto } from './dto/request/create-activity-type.dto.js';
import { ReactionTypeEnum } from './dto/request/react-to-activity.dto.js';
import { ReactionResponse } from './dto/response/reaction-response.dto.js';
import { ActivityResponse } from './dto/response/activity-response.dto.js';
import { GroupResponse } from '../groups/dto/response/group-response.dto.js';
import { UserResponse } from '../users/dto/response/user-response.dto.js';
import { parseUserType } from '../../helpers/parse-user-type.js';
import { parseActivityType } from '../../helpers/parse_activity_type.js';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getActivities(id: string) {
    const { data, error } = await this.supabase
      .from('vw_activities')
      .select('*')
      .eq('author_id', id);

    if (error) throw new Error(error.message);

    const activityIds: string[] = [];

    data.map((d) => activityIds.push(d.id));

    const { data: participantsData, error: participantsError } =
      await this.supabase
        .from('activity_participants')
        .select(
          `
          activity_id,
          users (
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
          )  
        `,
        )
        .in('activity_id', activityIds);

    if (participantsError) throw new Error(participantsError.message);

    const activities: ActivityResponse[] = [];

    data.map((d) => {
      const participants: UserResponse[] = [];

      participantsData.map((p) => {
        if (p.activity_id == d.id) participants.push(parseUserType(p.users));
      });

      const group: GroupResponse | null = d.group_id
        ? {
            id: d.group_id,
            name: d.group_name,
            picture: d.group_picture,
          }
        : null;

      activities.push(parseActivityType(d, group, participants));
    });

    return activities;
  }

  async getActivityById(id: string): Promise<ActivityResponse> {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    const participants: UserResponse[] = [];

    const { data: participantsData, error: participantsError } =
      await this.supabase
        .from('activity_participants')
        .select(
          `
          activity_id,
          users (
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
          )  
        `,
        )
        .eq('activity_id', id);

    if (participantsError) throw new Error(participantsError.message);

    participantsData.map((p) => participants.push(parseUserType(p.users)));

    const group: GroupResponse | null = data.group_id
      ? {
          id: data.group_id,
          name: data.group_name,
          picture: data.group_picture,
        }
      : null;

    return parseActivityType(data, group, participants);
  }

  async getActivityReactions(id: string): Promise<ReactionResponse[]> {
    const { data, error } = await this.supabase
      .from('vw_activity_reactions')
      .select('*')
      .eq('activity_id', id);

    if (error) throw new Error(error.message);

    const reactions: ReactionResponse[] = [];

    data.map((d) =>
      reactions.push({
        reaction: d.reaction,
        user: parseUserType(d),
      }),
    );

    return reactions;
  }

  async createActivity(
    body: CreateActivityDto,
    user: PayloadDto,
  ): Promise<ActivityResponse> {
    const { data: insertData, error: insertError } = await this.supabase
      .from('activities')
      .insert({
        author_id: user.sub,
        type: body.type,
        caption: body.caption,
        picture: body.picture,
        posted_on_group: body.group,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);

    const responseParticipants: UserResponse[] = [];
    if (body.participants) {
      const participants: { activity_id: string; user_id: string }[] = [];

      body.participants.map((p) =>
        participants.push({ activity_id: insertData.id, user_id: p }),
      );

      const { data: participantsData, error: participantsError } =
        await this.supabase
          .from('activity_participants')
          .insert(participants)
          .select(
            `
          activity_id,
          users (
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
          )  
        `,
          )
          .eq('activity_id', insertData.id);

      if (participantsError) throw new Error(participantsError.message);

      participantsData.map((p) =>
        responseParticipants.push(parseUserType(p.users)),
      );
    }

    const { data, error } = await this.supabase
      .from('vw_activities')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (error) throw new Error(error.message);

    const group: GroupResponse | null = data.group_id
      ? {
          id: data.group_id,
          name: data.group_name,
          picture: data.group_picture,
        }
      : null;

    return parseActivityType(data, group, responseParticipants);
  }

  async createActivityType(body: CreateActivityTypeDto) {
    const { error } = await this.supabase.from('activity_types').insert({
      name: body.name,
      discription: body.discription,
      reward_points: body.reward_points,
      picture: body.picture,
    });

    if (error) throw new Error(error.message);
  }

  async reactToActivity(
    reaction: ReactionTypeEnum,
    id: string,
    userId: string,
  ) {
    const { data: reactionExists, error: reactionExistsError } =
      await this.supabase
        .from('activity_reactions')
        .select('reaction')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (reactionExistsError) throw new Error(reactionExistsError.message);

    if (reactionExists) {
      const { error } = await this.supabase
        .from('activity_reactions')
        .update({
          reaction,
        })
        .eq('activity_id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.supabase.from('activity_reactions').insert({
        activity_id: id,
        user_id: userId,
        reaction,
      });

      if (error) throw new Error(error.message);
    }
  }

  async deleteActivity(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('author_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    const { error: delError } = await this.supabase
      .from('activities')
      .update({
        deleted: true,
      })
      .eq('id', id)
      .eq('author_id', userId);

    if (delError) throw new Error(delError.message);
  }

  async deleteActivityReaction(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('activity_reactions')
      .select('*')
      .eq('activity_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    const { error: delError } = await this.supabase
      .from('activity_reactions')
      .delete()
      .eq('activity_id', id)
      .eq('user_id', userId);

    if (delError) throw new Error(delError.message);
  }
}
