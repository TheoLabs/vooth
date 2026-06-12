/**
 * 녹음 화면 도메인 타입 — core-api 의 Episode / Cut / Line / Recording 엔티티 형태를 그대로 따른다.
 *
 * core-api 기준:
 * - Episode: id, contentId, title, chapter, status, cutCount, lineCount, cuts[]
 * - Cut:     id, episodeId, position(decimal), imageUrl, lines[]
 * - Line:    id, cutId, episodeId, characterId, position(decimal), script
 * - Recording(별도 애그리거트): id, lineId, episodeId, creatorId, audioUrl, durationMs,
 *                               status(RecordingStatus 숫자), take, rejectReason?, phase?
 *
 * (@vooth/shared 미의존 컨벤션 — 값/메타는 로컬에 둔다. shared 의 RecordingStatus 와 값 일치.)
 */

import type { CropBox } from '../lib/cropBox'

export type { CropBox }

/** 녹음(take) 상태. shared 와 동일한 숫자값. */
export enum RecordingStatus {
  RECORDED = 10, // 성우 녹음 제출
  REVIEW = 20, // 검수 대기
  APPROVED = 30, // 검수 통과(채택 가능)
  REJECTED = 40 // 반려(재녹음)
}

/** 허용 상태 전이(shared 와 동일). */
export const RECORDING_STATUS_TRANSITIONS: Record<RecordingStatus, RecordingStatus[]> = {
  [RecordingStatus.RECORDED]: [RecordingStatus.REVIEW],
  [RecordingStatus.REVIEW]: [RecordingStatus.APPROVED, RecordingStatus.REJECTED],
  [RecordingStatus.APPROVED]: [RecordingStatus.REVIEW],
  [RecordingStatus.REJECTED]: [RecordingStatus.REVIEW]
}

export function canTransitionRecording(from: RecordingStatus, to: RecordingStatus): boolean {
  return RECORDING_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/** 상태 배지 메타. */
export const RECORDING_STATUS_META: Record<RecordingStatus, { label: string; color: string; background: string }> = {
  [RecordingStatus.RECORDED]: { label: '녹음됨', color: '#1d4ed8', background: '#dbeafe' },
  [RecordingStatus.REVIEW]: { label: '검수 대기', color: '#b45309', background: '#fef3c7' },
  [RecordingStatus.APPROVED]: { label: '승인', color: '#15803d', background: '#dcfce7' },
  [RecordingStatus.REJECTED]: { label: '반려', color: '#b91c1c', background: '#fee2e2' }
}

/** Recording 엔티티(+ 표시용 creatorName — 실제로는 creator 조인으로 채워진다). */
export interface Recording {
  id: number
  lineId: number
  episodeId: number
  creatorId: number
  creatorName: string
  audioUrl?: string
  durationMs: number
  status: RecordingStatus
  take: number
  rejectReason?: string | null
}

/** Line 엔티티. */
export interface Line {
  id: number
  cutId: number
  episodeId: number
  characterId: number
  position: number
  script: string
}

/** Cut 엔티티. imageUrl=원본, cropBox=표시용 16:10 영역(저장 모델 B). */
export interface Cut {
  id: number
  episodeId: number
  position: number
  imageUrl: string
  imageWidth?: number | null
  imageHeight?: number | null
  cropBox?: CropBox | null
  lines: Line[]
}

/** Episode 엔티티(+ 표시용 contentTitle). */
export interface RecordingEpisode {
  id: number
  contentId: number
  contentTitle: string
  title: string
  chapter: number
  status: number
  cutCount: number
  lineCount: number
  cuts: Cut[]
}
