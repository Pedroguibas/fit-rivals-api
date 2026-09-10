import { UserResponse } from '../../../users/dto/response/user-response.dto.js';

export class GroupMemberResponse extends UserResponse {
  isGroupAdmin: boolean;
}
