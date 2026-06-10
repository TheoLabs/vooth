import { PaginationDto } from '@libs/utils';
import { IsOptional, IsString } from 'class-validator';

export class TagQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}
