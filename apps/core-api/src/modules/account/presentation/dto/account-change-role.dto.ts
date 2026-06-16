import { IsInt, IsNotEmpty } from 'class-validator';

export class AccountChangeRoleDto {
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
