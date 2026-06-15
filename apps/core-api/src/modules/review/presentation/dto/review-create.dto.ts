import { IsInt, IsNotEmpty } from 'class-validator';

export class ReviewCreateDto {
  @IsInt()
  @IsNotEmpty()
  episodeId: number;
}
