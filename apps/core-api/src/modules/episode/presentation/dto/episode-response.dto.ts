import { ResponseDto } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class LineResponseDto {
  @Expose()
  id: number;

  @Expose()
  characterId: number;

  @Expose()
  script: string;

  @Expose()
  position: number;
}

@Exclude()
export class CutResponseDto {
  @Expose()
  id: number;

  @Expose()
  position: number;

  @Expose()
  imageUrl: string;

  @Expose()
  @Type(() => LineResponseDto)
  lines: LineResponseDto[];
}

@Exclude()
export class EpisodeResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  contentId: number;

  @Expose()
  title: string;

  @Expose()
  chapter: number;

  @Expose()
  status: EpisodeStatus;

  @Expose()
  cutCount: number;

  @Expose()
  lineCount: number;

  // 상세 조회 시에만 채워진다(목록은 relations 미로드 → 보통 비어있음).
  @Expose()
  @Type(() => CutResponseDto)
  cuts: CutResponseDto[];
}
