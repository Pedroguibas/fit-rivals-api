import { UserResponse } from '../modules/users/dto/response/user-response.dto.js';

export function parseUserType(data: any): UserResponse {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    picture: data.picture,
    bio: data.bio,
    streak: data.streak,
    rankRating: data.rank_rating,
    createdAt: data.created_at,
  };
}
