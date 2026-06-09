import { ResponseDto } from '@libs/utils';
import { PermissionCategory } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PermissionResponseDto extends ResponseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  category: PermissionCategory;

  @Expose()
  description: string;
}
