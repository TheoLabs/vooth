import { CalendarDate, CALENDAR_DATE_REGEX, EpisodeStatus } from '@vooth/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CropBoxDto } from '@libs/utils';

export class AdminEpisodeUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  thumbnailFileId?: number | null;

  @ValidateNested()
  @Type(() => CropBoxDto)
  @IsOptional()
  thumbnailCropBox?: CropBoxDto | null;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @Matches(CALENDAR_DATE_REGEX)
  @IsString()
  @IsOptional()
  expectedPublishOn?: CalendarDate | null;
}

export class DirectorEpisodeStatusChangeDto {
  @IsIn([EpisodeStatus.DRAFT, EpisodeStatus.READY])
  @IsEnum(EpisodeStatus)
  status: EpisodeStatus;
}
