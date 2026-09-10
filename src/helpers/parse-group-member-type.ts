import { GroupMemberResponse } from '../modules/groups/dto/response/group-member-response.dto.js';
import { parseUserType } from './parse-user-type.js';

export function parseGroupMemberType(data: any): GroupMemberResponse {
  return {
    ...parseUserType(data),
    isGroupAdmin: data.admin,
  };
}
