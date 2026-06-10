import { ResponseDto } from '@libs/utils';
import { TagColor } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TagResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  color: TagColor;

  @Expose()
  usageCount: number;
}
