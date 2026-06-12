import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class CropBoxDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  w: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  h: number;
}

class ScriptLineItemDto {
  // 기존 대사면 id 포함(없으면 신규로 간주). upsert 매칭용.
  @IsOptional()
  @IsInt()
  id?: number;

  @IsInt()
  characterId: number;

  @IsString()
  @IsNotEmpty()
  script: string;

  @IsNumber()
  position: number;

  // 연출용: 컷 내 세로 위치(0~1). 미지정이면 표시/렌더 측 균등 분배 폴백.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  anchorY?: number;

  // 연출용: 이 대사 앞 간격(ms).
  @IsOptional()
  @IsInt()
  @Min(0)
  gapBeforeMs?: number;
}

class ScriptCutItemDto {
  // 기존 컷이면 id 포함(없으면 신규로 간주). upsert 매칭용.
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  // 원본 자연 크기(px). 연속 캔버스/렌더용.
  @IsOptional()
  @IsInt()
  imageWidth?: number;

  @IsOptional()
  @IsInt()
  imageHeight?: number;

  // 표시용 16:10 정규화 영역.
  @IsOptional()
  @ValidateNested()
  @Type(() => CropBoxDto)
  cropBox?: CropBoxDto;

  // 연출용: 컷 끝 머무는 시간(ms).
  @IsOptional()
  @IsInt()
  @Min(0)
  holdMs?: number;

  @IsNumber()
  position: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScriptLineItemDto)
  lineItems: ScriptLineItemDto[];
}

export class EpisodeScriptUploadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScriptCutItemDto)
  cutItems: ScriptCutItemDto[];
}
