import type { GroupResponse } from '../modules/groups/dto/response/group-response.dto.js';

export function parseGroupType(data: any): GroupResponse {
  return {
    id: data.id,
    name: data.name,
    picture: data.picture,
  };
}
