import { PaginationDto } from '@libs/utils';
import { IsOptional, IsString } from 'class-validator';

export class CreatorQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  searchKey?: string;

  @IsOptional()
  @IsString()
  searchValue?: string;
}
