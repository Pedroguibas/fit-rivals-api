import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateActivityDto {
  @IsInt()
  type: string;

  @IsOptional()
  @IsString()
  caption: string | null;

  @IsUrl()
  picture: string;

  @IsOptional()
  @IsUUID()
  group: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants: string[] | null;
}
