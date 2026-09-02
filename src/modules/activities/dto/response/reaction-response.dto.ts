import { UserResponse } from '../../../users/dto/response/user-response.dto.js';
import { ReactionTypeEnum } from '../request/react-to-activity.dto.js';

export type ReactionResponse = {
  user: UserResponse;
  reaction: ReactionTypeEnum;
};
