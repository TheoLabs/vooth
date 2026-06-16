import { IsInt, IsNotEmpty } from 'class-validator';

export class AccountActiveDto {
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
