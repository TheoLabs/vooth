import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RecordingCreateDto {
  @IsInt()
  @IsNotEmpty()
  lineId: number;

  @IsInt()
  @IsNotEmpty()
  episodeId: number;

  @IsString()
  @IsNotEmpty()
  audioUrl: string;

  @IsInt()
  @IsNotEmpty()
  durationMs: number;
}
