import { ResponseDto } from '@libs/utils';
import { CalendarDate, CropBox, EpisodeStatus } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
abstract class BaseEpisodeResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  contentId: number;

  @Expose()
  title: string;

  @Expose()
  thumbnailFileId: number | null;

  @Expose()
  thumbnailUrl: string | null;

  @Expose()
  thumbnailCropBox: CropBox | null;

  @Expose()
  chapter: number;

  @Expose()
  expectedPublishOn: CalendarDate | null;

  @Expose()
  isFree: boolean;

  @Expose()
  status: EpisodeStatus;
}

@Exclude()
export class AdminEpisodeResponseDto extends BaseEpisodeResponseDto {}

@Exclude()
export class DirectorEpisodeListResponseDto extends BaseEpisodeResponseDto {
  @Expose()
  cutCount: number;

  @Expose()
  lineCount: number;
}
