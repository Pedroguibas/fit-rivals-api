import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  picture?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  members?: string[] | null;
}
