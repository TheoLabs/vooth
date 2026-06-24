import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

abstract class BaseContentQueryDto extends PaginationDto {
  @IsIn(['title'])
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;
}

export class AdminContentQueryDto extends BaseContentQueryDto {
  @ToArray('number')
  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];

  @ToArray()
  @IsEnum(ContentStatus, { each: true })
  @IsOptional()
  statuses?: ContentStatus[];
}

export class DirectorContentQueryDto extends BaseContentQueryDto {
  @ToArray()
  @IsEnum(ContentStatus, { each: true })
  @IsOptional()
  statuses?: ContentStatus[];
}

export class CreatorContentQueryDto extends BaseContentQueryDto {}
