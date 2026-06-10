import { CharacterType } from '@vooth/shared';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CharacterCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CharacterType)
  @IsNotEmpty()
  type: CharacterType;

  @IsString()
  @IsNotEmpty()
  color: string;
}
