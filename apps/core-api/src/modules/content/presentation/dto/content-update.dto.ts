import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ContentUpdateDto {
  @IsOptional()
  @IsString()
  thumbnailImageUrl?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  tagIds?: number[];
}
