import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ContentQueryDto extends PaginationDto {
  @ToArray()
  @IsEnum(ContentStatus, { each: true })
  @IsOptional()
  statuses?: ContentStatus[];

  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}
