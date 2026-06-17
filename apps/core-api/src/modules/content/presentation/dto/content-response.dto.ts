import { ResponseDto } from '@libs/utils';
import { CalendarDate, ContentStatus, type CropBox } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class TagResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  color: string;
}

@Exclude()
abstract class BaseContentResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  thumbnailFileId: number;

  @Expose()
  thumbnailCropBox: CropBox;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: ContentStatus;

  @Expose()
  thumbnailUrl: string | null;

  @Expose()
  expectedPublishOn: CalendarDate | null;
}

@Exclude()
export class AdminContentResponseDto extends BaseContentResponseDto {
  @Expose()
  @Type(() => TagResponseDto)
  tags: TagResponseDto[];
}
