import { GroupData } from '../../../../types/GroupData.js';
import { UserResponse } from '../../../users/dto/response/user-response.dto.js';

export type InviteResponse = {
  id: string;
  userId: string;
  inviter: UserResponse;
  group: GroupData;
};
