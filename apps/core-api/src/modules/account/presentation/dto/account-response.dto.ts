import { ResponseDto } from '@libs/utils';
import { AccountStatus, AccountType } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class RoleResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

@Exclude()
export class AccountResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  roleId: number | null;

  @Expose()
  type: AccountType;

  @Expose()
  status: AccountStatus;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => RoleResponseDto)
  role: RoleResponseDto | null;
}
