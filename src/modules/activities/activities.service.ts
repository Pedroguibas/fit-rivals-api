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

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getActivities(id: string) {
    const { data, error } = await this.supabase
      .from('vw_activities')
      .select('*')
      .eq('author_id', id)
      .eq('deleted', false);

    if (error) throw new Error(error.message);

    const activities: ActivityResponse[] = [];

    data.map((d) => {
      const group: GroupResponse | null = d.group_id
        ? {
            id: d.group_id,
            name: d.group_name,
            picture: d.group_picture,
          }
        : null;

      activities.push({
        id: d.id,
        caption: d.caption,
        picture: d.picture,
        createdAt: d.created_at,
        type: {
          id: d.type_id,
          name: d.type_name,
          picture: d._type_picture,
          discription: d.type_discription,
          rewardPoints: d.type_reward_points,
        },
        author: {
          id: d.author_id,
          name: d.author_name,
          email: d.author_email,
          username: d.author_username,
          role: d.author_role,
          picture: d.author_picture,
          bio: d.author_bio,
          streak: d.author_streak,
          rankRating: d.author_rank_rating,
          createdAt: d.author_created_at,
        },
        group,
      });
    });

    return activities;
  }

  async getActivityById(id: string) {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('deleted', false)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    return data;
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
        user: {
          id: d.id,
          name: d.name,
          email: d.email,
          username: d.username,
          role: d.role,
          picture: d.picture,
          bio: d.bio,
          streak: d.streak,
          rankRating: d.rank_rating,
          createdAt: d.created_at,
        },
      }),
    );

    return reactions;
  }

  async createActivity(body: CreateActivityDto, user: PayloadDto) {
    const { data, error } = await this.supabase
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

    if (error) throw new Error(error.message);

    if (body.participants) {
      const participants: { activity_id: string; user_id: string }[] = [];

      body.participants.map((p) =>
        participants.push({ activity_id: data.id, user_id: p }),
      );

      const { error: participantsError } = await this.supabase
        .from('activity_participants')
        .insert(participants);

      if (participantsError) throw new Error(participantsError.message);
    }
  }

  async createActivityType(body: CreateActivityTypeDto) {
    const { error } = await this.supabase.from('activity_type').insert({
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
