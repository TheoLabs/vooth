import { PaginationDto } from '@libs/utils';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class RecordingQueryDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  episodeId?: number;
}
