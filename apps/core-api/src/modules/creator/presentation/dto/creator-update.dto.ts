import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatorUpdateDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsInt()
  @IsOptional()
  avatarFileId?: number | null;

  @IsString()
  @IsOptional()
  bio?: string | null;
}
