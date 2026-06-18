import { CharacterType } from '@vooth/shared';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class AdminCharacterUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CharacterType)
  @IsOptional()
  type?: CharacterType;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsInt()
  @IsOptional()
  avatarFileId?: number | null;
}
