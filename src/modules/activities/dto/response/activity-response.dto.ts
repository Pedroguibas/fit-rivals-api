import { ActivityTypeResponse } from './activity-type-response.dto.js';
import { UserResponse } from '../../../users/dto/response/user-response.dto.js';
import { GroupData } from '../../../../types/GroupData.js';

export type ActivityResponse = {
  id: string;
  caption: string;
  picture: string;
  createdAt: string;
  type: ActivityTypeResponse;
  author: UserResponse;
  group: GroupData | null;
  participants: UserResponse[];
  reaction: 'VALID' | 'INVALID' | 'UNSURE' | null;
};
