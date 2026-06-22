import { IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CropBoxDto } from '@libs/utils';

export class AdminCutUpdateDto {
  @IsInt()
  @IsOptional()
  order?: number;

  @IsInt()
  @IsOptional()
  imageFileId?: number;

  @IsInt()
  @IsOptional()
  imageWidth?: number;

  @IsInt()
  @IsOptional()
  imageHeight?: number;

  @ValidateNested()
  @Type(() => CropBoxDto)
  @IsOptional()
  imageCropBox?: CropBoxDto;
}
