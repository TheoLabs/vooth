import { ResponseDto } from '@libs/utils';
import { type CropBox } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

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
  imageCropBox: CropBox;

  @Expose()
  anchorY: number | null;

  @Expose()
  gap: number | null;

  @Expose()
  holdOverride: number | null;
}

@Exclude()
export class AdminCutResponseDto extends BaseCutResponseDto {}
