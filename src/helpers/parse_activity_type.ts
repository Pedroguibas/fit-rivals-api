import { ActivityResponse } from '../modules/activities/dto/response/activity-response.dto.js';
import { GroupResponse } from '../modules/groups/dto/response/group-response.dto.js';
import { UserResponse } from '../modules/users/dto/response/user-response.dto.js';

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
    author: {
      id: data.author_id,
      name: data.author_name,
      email: data.author_email,
      username: data.author_username,
      role: data.author_role,
      picture: data.author_picture,
      bio: data.author_bio,
      streak: data.author_streak,
      rankRating: data.author_rank_rating,
      createdAt: data.author_created_at,
    },
    group,
    participants: participants,
  };
};
