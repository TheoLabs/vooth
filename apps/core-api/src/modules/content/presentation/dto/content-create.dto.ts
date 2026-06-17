import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CropBoxDto } from '@libs/utils';

export class ContentCreateDto {
  @IsInt()
  @IsNotEmpty()
  thumbnailFileId: number;

  @ValidateNested()
  @Type(() => CropBoxDto)
  thumbnailCropBox: CropBoxDto;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsInt({ each: true })
  tagIds: number[];
}
