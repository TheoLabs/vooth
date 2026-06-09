import { IsArray, IsString } from 'class-validator';

export class RoleUpdateDto {
  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}
