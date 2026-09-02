import { GetUserResponse } from '../../../users/dto/response/get-user.dt.js';
import { ReactionTypeEnum } from '../request/react-to-activity.dto.js';

export type ReactionResponse = {
  user: GetUserResponse;
  reaction: ReactionTypeEnum;
};
