import { IsInt } from 'class-validator';

export class RecordingCreateDto {
  @IsInt()
  audioFileId: number;

  // take 는 서버가 (lineId, castingId) 의 max+1 로 할당한다(클라가 보내지 않음).

  @IsInt()
  durationMs: number;
}
