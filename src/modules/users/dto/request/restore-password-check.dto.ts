import { IsNotEmpty, IsString } from 'class-validator';
import { RestorePasswordRequestDto } from './restore-password-request.dto.js';

export class RestorePasswordCheckDto extends RestorePasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
