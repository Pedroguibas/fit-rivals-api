import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFriendRequestDto {
  @IsUUID()
  @IsNotEmpty()
  user: string;
}
