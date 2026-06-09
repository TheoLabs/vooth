import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@libs/utils';
import { ToArray } from '@libs/decorators';
import { RoleType } from '@vooth/shared';

export class RoleQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;

  @ToArray()
  @IsEnum(RoleType, { each: true })
  @IsOptional()
  types?: RoleType[];
}
