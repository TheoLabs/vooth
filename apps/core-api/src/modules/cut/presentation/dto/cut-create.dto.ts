import { CropBoxDto } from '@libs/utils';
import { Type } from 'class-transformer';
import { IsInt, ValidateNested } from 'class-validator';

export class AdminCutCreateDto {
  @IsInt()
  order: number;

  @IsInt()
  imageFileId: number;

  @IsInt()
  imageWidth: number;

  @IsInt()
  imageHeight: number;

  @ValidateNested()
  @Type(() => CropBoxDto)
  imageCropBox: CropBoxDto;
}
