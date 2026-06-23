import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AdminLineCreateDto {
  @IsInt()
  characterId: number;

  @IsString()
  @IsNotEmpty()
  script: string;

  @IsInt()
  order: number;
}
