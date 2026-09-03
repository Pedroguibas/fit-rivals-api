import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { FriendResponse } from './dto/response/friend-response.dto.js';
import { parseFriendRequest } from '../../helpers/parse-friend-request.js';

@Injectable()
export class FriendsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getFriends(self: string) {
    const { data, error } = await this.supabase
      .from('vw_friends')
      .select('*')
      .or(`first_id.eq.${self}, second_id.eq.${self}`);

    if (error) throw new Error(error.message);

    const friends: FriendResponse[] = [];

    data.map((d) => {
      if (d.first_id == self) {
        friends.push({
          id: d.id,
          friend: {
            id: d.second_id,
            name: d.second_name,
            username: d.second_username,
            email: d.second_email,
            picture: d.second_picture,
            bio: d.second_bio,
            streak: d.second_streak,
            rankRating: d.second_rank_rating,
            createdAt: d.second_created_at,
          },
        });
      } else {
        friends.push({
          id: d.id,
          friend: {
            id: d.first_id,
            name: d.first_name,
            username: d.first_username,
            email: d.first_email,
            picture: d.first_picture,
            bio: d.first_bio,
            streak: d.first_streak,
            rankRating: d.first_rank_rating,
            createdAt: d.first_created_at,
          },
        });
      }
    });

    return friends;
  }

  async removeFriend(id: string, self: string) {
    const { error } = await this.supabase
      .from('friends')
      .update({
        deleted: true,
        deleted_at: new Date(),
      })
      .eq('id', id)
      .or(`first.eq.${self}, second.eq.${self}`);

    if (error) throw new Error(error.message);
  }

  async getFriendRequests(self: string) {}

  async createFriendRequest(self: string, user: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .or(`username.eq.${user}, email.eq.${user}, friend_code.eq.${user}`)
      .eq('deleted', false)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new NotFoundException();

    const { data: isAlreadyFriend, error: isAlreadyFriendError } =
      await this.supabase
        .from('vw_friends')
        .select('id')
        .or(`first_id.eq.${self}, second_id.eq.${self}`)
        .or(`first_id.eq.${data.id}, second_id.eq.${data.id}`)
        .maybeSingle();

    if (isAlreadyFriendError) throw new Error(isAlreadyFriendError.message);

    if (isAlreadyFriend) throw new BadRequestException();

    const { data: hasUnrespondedRequest, error: hasUnrespondedRequestError } =
      await this.supabase
        .from('vw_friend_requests')
        .select('*')
        .eq('requester_id', self)
        .eq('user_id', data.id)
        .maybeSingle();

    if (hasUnrespondedRequestError)
      throw new Error(hasUnrespondedRequestError.message);

    if (hasUnrespondedRequest) return parseFriendRequest(hasUnrespondedRequest);

    const { data: insertData, error: insertError } = await this.supabase
      .from('friend_requests')
      .insert({
        requester: self,
        user_id: data.id,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);

    const { data: returnData, error: returnError } = await this.supabase
      .from('vw_friend_requests')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (returnError) throw new Error(returnError.message);

    return parseFriendRequest(returnData);
  }

  async acceptFriendRequest(id: string, self: string) {
    const { data, error } = await this.supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', self)
      .eq('responded', false)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new BadRequestException();

    const { error: insertError } = await this.supabase.from('friends').insert({
      first: data.requester,
      second: self,
    });

    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await this.supabase
      .from('friend_requests')
      .update({
        responded: true,
        accepted: true,
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);
  }

  async denyFriendRequest(id: string, self: string) {}
}
