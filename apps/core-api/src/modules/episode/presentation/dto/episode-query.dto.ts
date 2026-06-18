import { ToArray, ToBoolean } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { type CalendarDate, EpisodeStatus } from '@vooth/shared';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

abstract class BaseEpisodeQueryDto extends PaginationDto {
  @IsIn(['title'])
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;
}

export class AdminEpisodeQueryDto extends BaseEpisodeQueryDto {
  @ToArray()
  @IsEnum(EpisodeStatus, { each: true })
  @IsOptional()
  statuses?: EpisodeStatus[];

  @IsString()
  @IsOptional()
  minExpectedPublishOn?: CalendarDate;

  @IsString()
  @IsOptional()
  maxExpectedPublishOn?: CalendarDate;
}
