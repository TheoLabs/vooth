import { RoleType } from '@vooth/shared';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class RoleCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];

  @IsEnum(RoleType)
  type: RoleType;
}
