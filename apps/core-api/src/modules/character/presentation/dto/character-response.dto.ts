import { ResponseDto } from '@libs/utils';
import { CharacterType } from '@vooth/shared';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CharacterResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: CharacterType;

  @Expose()
  description: string | null;

  @Expose()
  avatarFileId: number | null;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  order: number;
}
