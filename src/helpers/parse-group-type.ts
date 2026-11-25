import type { GroupResponse } from '../modules/groups/dto/response/group-response.dto.js';
import { GroupData } from '../types/GroupData.js';

export function parseGroupData(data: any): GroupData {
  return {
    id: data.id,
    name: data.name,
    picture: data.picture,
  };
}

export function parseGroupType(data: any): GroupResponse {
  return {
    id: data.id,
    name: data.name,
    picture: data.picture,
    admin: false,
  };
}
