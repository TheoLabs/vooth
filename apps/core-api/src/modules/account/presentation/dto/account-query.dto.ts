import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@libs/utils';
import { ToArray } from '@libs/decorators';
import { AccountStatus, AccountType } from '@vooth/shared';

export class AccountQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  searchKey?: string;

  @IsString()
  @IsOptional()
  searchValue?: string;

  @ToArray()
  @IsEnum(AccountStatus, { each: true })
  @IsOptional()
  statuses?: AccountStatus[];

  @ToArray()
  @IsEnum(AccountType, { each: true })
  @IsOptional()
  types?: AccountType[];
}
