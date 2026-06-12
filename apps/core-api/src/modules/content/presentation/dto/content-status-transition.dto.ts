import { ContentStatus } from '@vooth/shared';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ContentStatusTransactionDto {
  @IsEnum(ContentStatus)
  @IsNotEmpty()
  nextStatus: ContentStatus;
}
