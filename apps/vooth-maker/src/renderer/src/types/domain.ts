/**
 * 멀티캐스팅 녹음 도메인 타입.
 *
 * 작품(Webtoon) → 회차(Episode) → 컷(Cut) → 대사(Line) → 녹음(Recording)
 * 대사 1개에 성우 여러 명이 녹음할 수 있다 → Line 1:N Recording (멀티캐스팅).
 */

/** 녹음 1건의 진행 상태 */
export type RecordingStatus = 'PENDING' | 'RECORDED' | 'REVIEW' | 'DONE' | 'REJECTED'

/** 한 대사에 대한 성우 1명의 녹음 */
export interface Recording {
  id: string
  lineId: string
  voiceActorId: string
  voiceActorName: string
  status: RecordingStatus
  audioUrl?: string
  /** 오디오 길이(ms). 타임라인 계산의 기준. */
  durationMs: number
}

/** 컷 안의 대사 1개 (성우별 녹음 N개를 가짐) */
export interface Line {
  id: string
  order: number
  text: string
  character?: string
  recordings: Recording[]
  /** 최종 재생에 사용할 녹음(take)의 id. 멀티캐스팅 중 하나만 선택된다. 미선택이면 undefined. */
  selectedRecordingId?: string
  /** 이 대사 앞에 두는 간격(ms). 기본 0. */
  gapBeforeMs: number
}

/** 회차를 구성하는 컷(이미지) 1개 */
export interface Cut {
  id: string
  order: number
  imageUrl: string
  lines: Line[]
  /** 컷 대사들이 끝난 뒤 유지(hold)되는 시간(ms). 기본 0. */
  holdMs: number
  /** 컷 전환 효과(선택). */
  transition?: string
}

/** 작품의 회차 1개 */
export interface Episode {
  id: string
  webtoonId: string
  webtoonTitle: string
  episodeNo: number
  title: string
  cuts: Cut[]
}

/** 상태별 라벨/색상 메타 (UI 배지에 사용) */
export interface RecordingStatusMeta {
  label: string
  /** 글자색 */
  color: string
  /** 배경색 */
  background: string
}

export const RECORDING_STATUS_META: Record<RecordingStatus, RecordingStatusMeta> = {
  PENDING: { label: '대기', color: '#475569', background: '#f1f5f9' },
  RECORDED: { label: '녹음됨', color: '#1d4ed8', background: '#dbeafe' },
  REVIEW: { label: '검수중', color: '#b45309', background: '#fef3c7' },
  DONE: { label: '완료', color: '#15803d', background: '#dcfce7' },
  REJECTED: { label: '반려', color: '#b91c1c', background: '#fee2e2' }
}
