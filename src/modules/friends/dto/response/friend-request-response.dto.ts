import { UserResponse } from '../../../users/dto/response/user-response.dto.js';

export type FriendRequestResponse = {
  id: string;
  requester: UserResponse;
  user: UserResponse;
};
