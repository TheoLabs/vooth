import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class BaseContentQueryDto extends PaginationDto {
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

export class CreatorContentQueryDto extends BaseContentQueryDto {}

export class DirectorContentQueryDto extends BaseContentQueryDto {}
