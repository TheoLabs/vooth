import { IsInt, IsOptional, IsString } from 'class-validator';

export class AdminLineUpdateDto {
  @IsInt()
  @IsOptional()
  characterId?: number;

  @IsString()
  @IsOptional()
  script?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
