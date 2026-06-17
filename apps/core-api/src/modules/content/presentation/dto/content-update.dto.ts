import { CropBoxDto } from '@libs/utils';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AdminContentUpdateDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  thumbnailFileId?: number;

  @ValidateNested()
  @Type(() => CropBoxDto)
  @IsOptional()
  thumbnailCropBox?: CropBoxDto;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];
}
