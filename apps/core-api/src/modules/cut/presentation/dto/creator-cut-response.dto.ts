import { CharacterType } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * vooth-maker 녹음 화면 응답.
 * 컷(이미지) + 라인(대사) + 라인별 내 테이크(recordings) + isMine + 등장 캐릭터.
 * 연출값(gap/holdOverride/anchorMetadata)·내부값(creatorId/castingId/audioFileId 등)은 노출하지 않는다.
 */
@Exclude()
export class CreatorRecordingDto {
  @Expose()
  id: number;

  @Expose()
  take: number;

  @Expose()
  isAdopted: boolean;

  @Expose()
  durationMs: number;

  @Expose()
  audioUrl: string | null;
}

@Exclude()
export class CreatorLineDto {
  @Expose()
  id: number;

  @Expose()
  characterId: number;

  @Expose()
  script: string;

  @Expose()
  order: number;

  @Expose()
  anchorY: number | null;

  /** 현재 성우가 맡은 캐릭터의 대사인지 */
  @Expose()
  isMine: boolean;

  /** 내 테이크 목록(take 순, 최대 3) */
  @Expose()
  @Type(() => CreatorRecordingDto)
  recordings: CreatorRecordingDto[];
}

@Exclude()
export class CreatorCutDto {
  @Expose()
  id: number;

  @Expose()
  episodeId: number;

  @Expose()
  order: number;

  @Expose()
  imageUrl: string | null;

  @Expose()
  imageWidth: number;

  @Expose()
  imageHeight: number;

  @Expose()
  @Type(() => CreatorLineDto)
  lines: CreatorLineDto[];
}

@Exclude()
export class CreatorCharacterDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: CharacterType;
}
