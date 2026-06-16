import { IsInt, IsNotEmpty } from 'class-validator';

export class AccountApproveDto {
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
