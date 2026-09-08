import type { FriendRequestResponse } from '../modules/friends/dto/response/friend-request-response.dto.js';
import { parseUserType } from './parse-user-type.js';

export function parseFriendRequest(data: any): FriendRequestResponse {
  return {
    id: data.id,
    requester: parseUserType(data, 'requester_'),
    user: parseUserType(data, 'user_'),
  };
}
