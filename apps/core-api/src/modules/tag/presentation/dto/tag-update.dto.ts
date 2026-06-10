import { TagColor } from '@vooth/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TagUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TagColor)
  color?: TagColor;
}
