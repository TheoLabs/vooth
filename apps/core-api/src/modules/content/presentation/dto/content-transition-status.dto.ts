import { ContentStatus } from '@vooth/shared';
import { IsEnum } from 'class-validator';

export class ContentTransitionStatusDto {
  @IsEnum(ContentStatus)
  nextStatus: ContentStatus;
}
