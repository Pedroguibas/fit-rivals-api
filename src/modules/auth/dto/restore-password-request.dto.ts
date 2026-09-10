import { IsEmail } from 'class-validator';

export class RestorePasswordRequestDto {
  @IsEmail()
  email: string;
}
