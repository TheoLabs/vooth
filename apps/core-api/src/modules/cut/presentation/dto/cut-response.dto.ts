import { ResponseDto } from '@libs/utils';
import { Exclude, Expose, Type } from 'class-transformer';
import { AnchorDto } from './anchor.dto';

@Exclude()
class LineResponseDto {
  @Expose()
  id: number;

  @Expose()
  cutId: number;

  @Expose()
  characterId: number;

  @Expose()
  script: string;

  @Expose()
  order: number;

  @Expose()
  anchorY: number | null;

  @Expose()
  @Type(() => AnchorDto)
  anchorMetadata: AnchorDto;
}

@Exclude()
abstract class BaseCutResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  episodeId: number;

  @Expose()
  order: number;

  @Expose()
  imageFileId: number;

  @Expose()
  imageUrl: string;

  @Expose()
  imageWidth: number;

  @Expose()
  imageHeight: number;

  @Expose()
  gap: number | null;

  @Expose()
  holdOverride: number | null;
}

@Exclude()
export class AdminCutResponseDto extends BaseCutResponseDto {
  @Expose()
  @Type(() => LineResponseDto)
  lines: LineResponseDto[];
}

@Exclude()
export class DirectorCutListResponseDto extends BaseCutResponseDto {
  @Expose()
  @Type(() => LineResponseDto)
  lines: LineResponseDto[];
}
