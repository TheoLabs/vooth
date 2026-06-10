import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { CharacterType } from '@vooth/shared';
import { IsEnum, IsOptional } from 'class-validator';

export class CharacterQueryDto extends PaginationDto {
  @ToArray()
  @IsEnum(CharacterType, { each: true })
  @IsOptional()
  types?: CharacterType[];
}
