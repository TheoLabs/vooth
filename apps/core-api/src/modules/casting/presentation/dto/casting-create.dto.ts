import { IsNotEmpty, IsNumber } from 'class-validator';

export class CastingCreateDto {
  @IsNumber()
  @IsNotEmpty()
  characterId: number;

  @IsNumber()
  @IsNotEmpty()
  creatorId: number;
}
