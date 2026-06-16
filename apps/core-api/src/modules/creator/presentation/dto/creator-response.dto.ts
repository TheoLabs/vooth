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

@Exclude()
export class AdminCreatorResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  accountId: number;

  @Expose()
  nickname: string;

  @Expose()
  avatarFileId: number | null;

  @Expose()
  bio: string | null;

  @Expose()
  @Type(() => AccountResponseDto)
  account: AccountResponseDto;
}
