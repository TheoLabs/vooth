import { IsBoolean } from 'class-validator';

export class CastingChangePublishDto {
  @IsBoolean()
  isPublished: boolean;
}
