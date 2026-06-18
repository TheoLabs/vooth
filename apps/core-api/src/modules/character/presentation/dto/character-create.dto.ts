import { CharacterType } from '@vooth/shared';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminCharacterCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CharacterType)
  @IsNotEmpty()
  type: CharacterType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  avatarFileId?: number;
}
