import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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
}

class ScriptCutItemDto {
  // 기존 컷이면 id 포함(없으면 신규로 간주). upsert 매칭용.
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

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
