import { PaginationDto } from '@libs/utils';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

/** 채택(또는 변경): (lineId × 본인) → recordingId. */
export class LineTakeSelectDto {
  @IsInt()
  @IsNotEmpty()
  lineId: number;

  @IsInt()
  @IsNotEmpty()
  recordingId: number;
}

export class LineTakeQueryDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  episodeId?: number;
}
