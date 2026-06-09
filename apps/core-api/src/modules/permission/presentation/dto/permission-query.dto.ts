import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { PermissionCategory } from '@vooth/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class PermissionQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  searchKey?: string;

  @IsOptional()
  @IsString()
  searchValue?: string;

  @ToArray()
  @IsEnum(PermissionCategory, { each: true })
  @IsOptional()
  categories?: PermissionCategory[];
}
