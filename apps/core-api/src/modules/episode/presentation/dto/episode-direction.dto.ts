import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';

class DirectionLineDto {
  @IsInt()
  id: number;

  // 컷 내 세로 위치(0~1).
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  anchorY?: number;

  // 이 대사 앞 간격(ms).
  @IsOptional()
  @IsInt()
  @Min(0)
  gapBeforeMs?: number;
}

class DirectionCutDto {
  @IsInt()
  id: number;

  // 컷 끝 머무는 시간(ms).
  @IsOptional()
  @IsInt()
  @Min(0)
  holdMs?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectionLineDto)
  lines?: DirectionLineDto[];
}

/** 연출 부분 수정 — anchorY/gapBeforeMs/holdMs 만. 스크립트(컷/대사 구성)는 미변경. */
export class EpisodeDirectionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectionCutDto)
  cuts: DirectionCutDto[];
}
