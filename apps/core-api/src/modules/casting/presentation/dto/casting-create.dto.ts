import { IsInt } from 'class-validator';

export class CastingCreateDto {
  @IsInt()
  creatorId: number;
}
