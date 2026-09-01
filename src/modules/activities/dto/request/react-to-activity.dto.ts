import { IsEnum } from 'class-validator';

export enum ReactionTypeEnum {
  VALID = 'VALID',
  INVALID = 'INVALID',
  UNSURE = 'UNSURE',
}

export class ReactToActivityDto {
  @IsEnum(ReactionTypeEnum)
  reactionType: ReactionTypeEnum;
}
