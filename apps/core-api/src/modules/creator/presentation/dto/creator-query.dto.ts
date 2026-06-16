import { PaginationDto } from '@libs/utils';
import { IsIn, IsOptional, IsString } from 'class-validator';

abstract class BaseCreatorQueryDto extends PaginationDto {}

export class AdminCreatorQueryDto extends BaseCreatorQueryDto {
  @IsIn(['nickname'])
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}
