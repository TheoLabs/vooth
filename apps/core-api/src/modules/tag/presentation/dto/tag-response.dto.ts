import { ResponseDto } from '@libs/utils';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
class BaseTagResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  color: string;

  @Expose()
  usageCount: number;
}

@Exclude()
export class AdminTagResponseDto extends BaseTagResponseDto {}
