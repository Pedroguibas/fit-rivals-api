import { ActivityTypeResponse } from './activity-type-response.dto.js';
import { GroupResponse } from '../../../groups/dto/response/group-response.dto.js';
import { UserResponse } from '../../../users/dto/response/user-response.dto.js';

export type ActivityResponse = {
  id: string;
  caption: string;
  picture: string;
  createdAt: string;
  type: ActivityTypeResponse;
  author: UserResponse;
  group: GroupResponse | null;
  participants: UserResponse[];
};
