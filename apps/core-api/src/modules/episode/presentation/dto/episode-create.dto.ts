import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EpisodeCreateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  chapter: number;
}
