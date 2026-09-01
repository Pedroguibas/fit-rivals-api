import { IsArray, IsString } from 'class-validator';

export class InviteToGroupDto {
  @IsArray()
  @IsString({ each: true })
  users: string[];
}
