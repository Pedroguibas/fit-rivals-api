import { UserResponse } from '../../../users/dto/response/user-response.dto.js';
import { GroupResponse } from './group-response.dto.js';

export type InviteResponse = {
  id: string;
  userId: string;
  inviter: UserResponse;
  group: GroupResponse;
};
