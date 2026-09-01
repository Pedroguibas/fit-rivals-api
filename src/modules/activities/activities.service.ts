import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { PayloadDto } from '../auth/dto/payload.dto.js';
import { CreateActivityDto } from './dto/request/create-activity.dto.js';
import { CreateActivityTypeDto } from './dto/request/create-activity-type.dto.js';
import { ReactionTypeEnum } from './dto/request/react-to-activity.dto.js';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getActivities(id: string) {
    const { data, error } = await this.supabase
      .from('activity')
      .select('*')
      .eq('author_id', id);

    if (error) throw new Error(error.message);

    return data;
  }

  async getActivityById(id: string) {
    const { data, error } = await this.supabase
      .from('activity')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async getActivityReactions(id: string) {
    const { data, error } = await this.supabase
      .from('activity_reaction')
      .select('*')
      .eq('activity_id', id);

    if (error) throw new Error(error.message);

    return data;
  }

  async createActivity(body: CreateActivityDto, user: PayloadDto) {
    const { data, error } = await this.supabase
      .from('activity')
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
        .from('activity_reaction')
        .select('reaction')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (reactionExistsError) throw new Error(reactionExistsError.message);

    if (reactionExists) {
      const { error } = await this.supabase
        .from('activity_reaction')
        .update({
          reaction,
        })
        .eq('activity_id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.supabase.from('activity_reaction').insert({
        activity_id: id,
        user_id: userId,
        reaction,
      });

      if (error) throw new Error(error.message);
    }
  }
}
