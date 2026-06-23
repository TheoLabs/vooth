import { IsInt, IsOptional } from 'class-validator';

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
}
