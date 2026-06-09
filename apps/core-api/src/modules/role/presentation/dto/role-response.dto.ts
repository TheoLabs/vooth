import { ResponseDto } from '@libs/utils';
import { PermissionCategory, RoleType } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class PermissionDto {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  category: PermissionCategory;
}

@Exclude()
export class RoleResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  type: RoleType;

  @Expose()
  name: string;

  @Expose()
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
