import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RoleCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}
