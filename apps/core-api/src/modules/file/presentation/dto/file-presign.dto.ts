import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/** presigned 업로드 URL 발급 요청. */
export class FilePresignDto {
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsInt()
  @Min(1)
  size: number;
}
