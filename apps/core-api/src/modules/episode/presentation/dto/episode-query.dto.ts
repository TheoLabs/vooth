import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { IsOptional, IsString } from 'class-validator';

export class EpisodeQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  searchKey?: string;

  @IsOptional()
  @IsString()
  searchValue?: string;

  @ToArray()
  @IsOptional()
  statuses?: string[];
}
