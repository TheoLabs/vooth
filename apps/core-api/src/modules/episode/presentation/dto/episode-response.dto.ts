import { ResponseDto } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

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
}
