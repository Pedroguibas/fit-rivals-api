import { SelfUserResponse } from '../modules/users/dto/response/self-user-response.dto.js';

export function parseSelfUserType(data: any): SelfUserResponse {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    friendCode: data.friend_code,
    picture: data.picture,
    bio: data.bio,
    streak: data.streak,
    rankRating: data.rank_rating,
    createdAt: data.created_at,
  };
}
