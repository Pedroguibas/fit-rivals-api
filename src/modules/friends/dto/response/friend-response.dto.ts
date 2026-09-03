import { UserResponse } from '../../../users/dto/response/user-response.dto.js';

export type FriendResponse = {
  id: string;
  friend: UserResponse;
};
