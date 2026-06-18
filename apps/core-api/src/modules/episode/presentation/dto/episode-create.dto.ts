import { IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CropBoxDto } from '@libs/utils';

export class AdminEpisodeCreateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  thumbnailFileId?: number;

  @ValidateNested()
  @Type(() => CropBoxDto)
  @IsOptional()
  thumbnailCropBox?: CropBoxDto;

  @IsInt()
  @IsNotEmpty()
  chapter: number;
}
