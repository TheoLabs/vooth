import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, ValidateNested } from 'class-validator';

class AnchorYItemDto {
  @IsInt()
  cutId: number;

  @IsInt()
  lineId: number;

  @IsNumber()
  anchorY: number;
}

export class LineSetAnchorYDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnchorYItemDto)
  anchorYItems: AnchorYItemDto[];
}
