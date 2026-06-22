import { IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AnchorDto } from '../anchor.dto';

export class AdminLineCreateDto {
  @IsInt()
  characterId: number;

  @IsString()
  @IsNotEmpty()
  script: string;

  @IsInt()
  order: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnchorDto)
  anchorMetadata?: AnchorDto;
}
