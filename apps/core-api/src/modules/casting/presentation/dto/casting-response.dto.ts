import { ResponseDto } from '@libs/utils';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class CreatorDto {
  @Expose()
  id: number;

  @Expose()
  accountId: number;

  @Expose()
  nickname: string;

  @Expose()
  avatarFileId: number | null;

  @Expose()
  avatarUrl: string | null;
}

@Exclude()
abstract class BaseCastingResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  characterId: number;

  @Expose()
  creatorId: number;

  @Expose()
  contentId: number;

  @Expose()
  isPublished: boolean;
}

@Exclude()
export class AdminCastingResponseDto extends BaseCastingResponseDto {
  @Expose()
  @Type(() => CreatorDto)
  creator: CreatorDto;
}
