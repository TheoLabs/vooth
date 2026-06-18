import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { CharacterType } from '@vooth/shared';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

abstract class BaseCharacterQueryDto extends PaginationDto {
  @IsIn(['name'])
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;

  @ToArray()
  @IsEnum(CharacterType, { each: true })
  @IsOptional()
  types?: CharacterType[];
}

export class AdminCharacterQueryDto extends BaseCharacterQueryDto {}
