import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class FilePresignDto {
  /** 원본 파일명(확장자 추출용). */
  @IsString()
  @IsNotEmpty()
  originalName: string;

  /** MIME 타입(예: image/png). presigned PUT 요청도 동일 Content-Type 으로 보내야 한다. */
  @IsString()
  @Matches(/^[-\w.]+\/[-\w.+]+$/, { message: '유효한 MIME 타입이 아닙니다.' })
  mimeType: string;

  /** 바이트 크기(1 ~ 100MB). */
  @IsInt()
  @Min(1)
  @Max(104857600)
  size: number;

  /** 키 접두사(예: creators/avatar). 소문자/숫자/`/_-` 만 허용. 미지정 시 uploads. */
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9][a-z0-9/_-]*$/, { message: '유효한 prefix 가 아닙니다.' })
  prefix?: string;
}
