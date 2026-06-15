import { ToArray } from '@libs/decorators';
import { PaginationDto } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { IsOptional, IsString } from 'class-validator';

class BaseEpisodeQueryDto extends PaginationDto {}

export class AdminEpisodeQueryDto extends BaseEpisodeQueryDto {
  @IsOptional()
  @IsString()
  searchKey?: string;

  @IsOptional()
  @IsString()
  searchValue?: string;

  @ToArray()
  @IsOptional()
  statuses?: EpisodeStatus[];
}

export class DirectorEpisodeQueryDto extends BaseEpisodeQueryDto {}
