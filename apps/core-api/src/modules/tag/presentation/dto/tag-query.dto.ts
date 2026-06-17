import { PaginationDto } from '@libs/utils';
import { IsIn, IsOptional, IsString } from 'class-validator';

class BaseTagQueryDto extends PaginationDto {
  @IsIn(['name'])
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}

export class AdminTagQueryDto extends BaseTagQueryDto {}
