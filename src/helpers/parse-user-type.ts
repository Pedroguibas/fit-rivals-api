import { UserResponse } from '../modules/users/dto/response/user-response.dto.js';

export function parseUserType(data: any, prefix: string = ''): UserResponse {
  return {
    id: data[prefix + 'id'],
    name: data[prefix + 'name'],
    email: data[prefix + 'email'],
    username: data[prefix + 'username'],
    picture: data[prefix + 'picture'],
    bio: data[prefix + 'bio'],
    streak: data[prefix + 'streak'],
    rankRating: data[prefix + 'rank_rating'],
    createdAt: data[prefix + 'created_at'],
  };
}
