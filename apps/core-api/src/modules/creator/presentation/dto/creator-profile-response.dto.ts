import { ResponseDto } from '@libs/utils';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class AccountResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;
}

/** 크리에이터 본인(creators/me) 프로필 응답. avatarUrl 은 avatarFileId 에서 유도(파생). */
@Exclude()
export class CreatorProfileResponseDto extends ResponseDto {
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

  @Expose()
  bio: string | null;

  @Expose()
  @Type(() => AccountResponseDto)
  account: AccountResponseDto;
}
