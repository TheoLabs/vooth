import { IsNotEmpty, IsNumber } from 'class-validator';

export class AccountApproveDto {
  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}
