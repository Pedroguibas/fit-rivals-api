import { UserResponse } from './user-response.dto.js';

export class SelfUserResponse extends UserResponse {
  role: string;
  friendCode: string;
}
