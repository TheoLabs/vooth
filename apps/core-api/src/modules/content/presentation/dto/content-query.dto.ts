import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

class BaseContentQueryDto extends PaginationDto {
  @IsIn(['title'])
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}

export class AdminContentQueryDto extends BaseContentQueryDto {
  @ToArray()
  @IsEnum(ContentStatus, { each: true })
  @IsOptional()
  statuses?: ContentStatus[];
}
