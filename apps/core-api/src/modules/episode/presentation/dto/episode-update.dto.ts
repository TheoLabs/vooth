import { EpisodeStatus } from '@vooth/shared';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class EpisodeUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  chapter?: number;

  @IsOptional()
  @IsEnum(EpisodeStatus)
  status?: EpisodeStatus;
}
