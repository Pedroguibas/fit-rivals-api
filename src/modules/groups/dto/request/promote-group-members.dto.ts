import { IsArray, IsUUID } from 'class-validator';

export class PromoteGroupMembersDto {
  @IsArray()
  @IsUUID('all', { each: true })
  members: string[];
}
