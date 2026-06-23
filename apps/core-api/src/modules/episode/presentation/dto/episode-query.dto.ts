import { ToArray, ToBoolean } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { type CalendarDate, EpisodeStatus } from '@vooth/shared';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

abstract class BaseEpisodeQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  searchValue?: string;

  @ToArray()
  @IsEnum(EpisodeStatus, { each: true })
  @IsOptional()
  statuses?: EpisodeStatus[];
}

export class AdminEpisodeQueryDto extends BaseEpisodeQueryDto {
  @IsIn(['title'])
  @IsOptional()
  searchKey?: string;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsString()
  @IsOptional()
  minExpectedPublishOn?: CalendarDate;

  @IsString()
  @IsOptional()
  maxExpectedPublishOn?: CalendarDate;
}

export class DirectorEpisodeQueryDto extends BaseEpisodeQueryDto {}
