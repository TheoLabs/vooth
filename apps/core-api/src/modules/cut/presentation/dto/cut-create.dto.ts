import { IsInt } from 'class-validator';

export class AdminCutCreateDto {
  @IsInt()
  order: number;

  @IsInt()
  imageFileId: number;

  @IsInt()
  imageWidth: number;

  @IsInt()
  imageHeight: number;
}
