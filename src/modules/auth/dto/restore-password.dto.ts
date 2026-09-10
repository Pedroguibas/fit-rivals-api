import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RestorePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
