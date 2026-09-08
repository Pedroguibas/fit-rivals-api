import { ActivityResponse } from '../modules/activities/dto/response/activity-response.dto.js';
import { GroupResponse } from '../modules/groups/dto/response/group-response.dto.js';
import { UserResponse } from '../modules/users/dto/response/user-response.dto.js';
import { parseUserType } from './parse-user-type.js';

export const parseActivityType = (
  data: any,
  group: GroupResponse | null,
  participants: UserResponse[],
): ActivityResponse => {
  return {
    id: data.id,
    caption: data.caption,
    picture: data.picture,
    createdAt: data.created_at,
    type: {
      id: data.type_id,
      name: data.type_name,
      picture: data._type_picture,
      discription: data.type_discription,
      rewardPoints: data.type_reward_points,
    },
    author: parseUserType(data, 'author_'),
    group,
    participants: participants,
  };
};
