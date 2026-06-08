import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@libs/utils';

export class AccountQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}
