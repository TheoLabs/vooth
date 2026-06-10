import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ContentCreateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  thumbnailImageUrl: string;

  @IsArray()
  @IsNumber({}, { each: true })
  tagIds: number[];
}
