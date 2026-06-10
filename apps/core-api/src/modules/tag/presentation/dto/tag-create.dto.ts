import { TagColor } from '@vooth/shared';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class TagCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TagColor)
  @IsNotEmpty()
  color: TagColor;
}
