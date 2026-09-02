import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateActivityTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  discription: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  reward_points: number;

  @IsUrl()
  picture: string;
}
