/**
 * 연출·제작(vooth-tool) 도메인 타입 (MOCK 전용).
 *
 * vooth-tool 패키지는 @vooth/shared 에 의존하지 않으므로, 화면 구성을 위해
 * docs/content-domain-design.md(§12~16)의 모델을 로컬에 미러링한다.
 * 실제 배선 시에는 directors/* API 응답 DTO 로 대체한다.
 */

/* ──────────────────────────── 회차 상태 (EpisodeStatus) ──────────────────────────── */

/** docs §16.2 / packages/shared/episode.ts 미러 (문자열 enum). */
export enum EpisodeStatus {
  DRAFT = 'draft',
  READY = 'ready',
  RECORDING = 'recording',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published'
}

export const EPISODE_STATUS_LABEL: Record<EpisodeStatus, string> = {
  [EpisodeStatus.DRAFT]: '초안',
  [EpisodeStatus.READY]: '녹음 대기',
  [EpisodeStatus.RECORDING]: '녹음 중',
  [EpisodeStatus.REVIEWING]: '검수 중',
  [EpisodeStatus.APPROVED]: '검수 완료',
  [EpisodeStatus.SCHEDULED]: '발행 대기',
  [EpisodeStatus.PUBLISHED]: '발행'
}

/* ──────────────────────────── 캐릭터 (Character) ──────────────────────────── */

export enum CharacterType {
  MAIN = 'main',
  SUPPORTING = 'supporting',
  EXTRA = 'extra',
  NARRATOR = 'narrator'
}

export const CHARACTER_TYPE_LABEL: Record<CharacterType, string> = {
  [CharacterType.MAIN]: '주연',
  [CharacterType.SUPPORTING]: '조연',
  [CharacterType.EXTRA]: '엑스트라',
  [CharacterType.NARRATOR]: '내레이터'
}

export interface Character {
  id: number
  contentId: number
  name: string
  type: CharacterType
  color: string // #RRGGBB UI 표시색
}

/* ──────────────────────────── 녹음 (Recording) ──────────────────────────── */

/** docs §13.4 RecordingStatus 미러. */
export enum RecordingStatus {
  RECORDED = 'recorded', // 성우 제출
  REVIEW = 'review', // 검수 대기
  APPROVED = 'approved', // 검수 통과(채택 가능)
  REJECTED = 'rejected' // 반려(재녹음)
}

export const RECORDING_STATUS_LABEL: Record<RecordingStatus, string> = {
  [RecordingStatus.RECORDED]: '제출됨',
  [RecordingStatus.REVIEW]: '검수 대기',
  [RecordingStatus.APPROVED]: '승인',
  [RecordingStatus.REJECTED]: '반려'
}

/** docs §13.2 Recording(take 그 자체). (line × creator) 별 멀티 take. */
export interface Recording {
  id: number
  lineId: number
  episodeId: number
  creatorId: number
  take: number // (line, creator) 별 테이크 번호
  durationMs: number // 타임라인 길이 원천
  status: RecordingStatus
  rejectReason?: string
  /** mock 파형 데이터(0~1 정규화 amplitude 배열). */
  waveform: number[]
}

/* ──────────────────────────── 컷·대사 (Cut / Line) ──────────────────────────── */

/** 정규화 크롭 영역(0~1). packages/shared/crop-box.ts 미러. */
export interface CropBox {
  x: number
  y: number
  w: number
  h: number
}

/** 전환 효과(슬라이드 모드용). 연속 스크롤 MVP 엔 불필요하나 모델 보존. */
export enum CutTransition {
  NONE = 'none',
  FADE = 'fade',
  SLIDE = 'slide',
  CUT = 'cut'
}

export const CUT_TRANSITION_LABEL: Record<CutTransition, string> = {
  [CutTransition.NONE]: '없음',
  [CutTransition.FADE]: '페이드',
  [CutTransition.SLIDE]: '슬라이드',
  [CutTransition.CUT]: '컷 전환'
}

/** docs §12.2 / §15. Line — 컷 하위 대사. 연출값(anchorY/gapBeforeMs)을 가진다. */
export interface Line {
  id: number
  cutId: number
  episodeId: number
  position: number
  text: string // 대사 (등록은 back-office. tool 에선 read-only)
  characterId: number
  /** 앞 간격(ms). 음수 = 앞 라인과 겹침. docs §12 */
  gapBeforeMs: number
  /** 발화 지점의 컷 내 세로 위치(0~1, null=균등분배 폴백). docs §15.1 */
  anchorY: number | null
  /** (line × creator) 별 채택본. key=creatorId → recordingId. docs §13.3 LineTake */
  selectedTakeByCreator: Record<number, number>
}

/** docs §12.2 / §15. Cut — 컷. 이미지·cropBox·holdMs·transition. */
export interface Cut {
  id: number
  episodeId: number
  position: number
  imageUrl: string // 원본(mock placeholder)
  imageWidth: number
  imageHeight: number
  cropBox: CropBox // 표시용 focal 영역
  holdMs: number // 마지막 대사 뒤 머무는 시간
  transition: CutTransition
  lines: Line[]
}

/* ──────────────────────────── 회차·작품 (Episode / Content) ──────────────────────────── */

export interface EpisodeSummary {
  id: number
  contentId: number
  contentTitle: string
  episodeNo: number
  title: string
  status: EpisodeStatus
  cutCount: number
  lineCount: number
  /** 채택 완료 라인 수 / 전체(캐스트 기준 채택 진행). */
  adoptedLineCount: number
  totalAdoptableCount: number
  updatedAt: string // UTC ISO
}

export interface EpisodeDetail extends EpisodeSummary {
  cuts: Cut[]
  characters: Character[]
  /** 이 회차 캐스팅된 성우(캐스트). */
  casts: Cast[]
}

export interface Cast {
  creatorId: number
  creatorName: string
  /** 이 성우가 맡은 캐릭터 ids. */
  characterIds: number[]
}

/* ──────────────────────────── 렌더 (Render) ──────────────────────────── */

/** docs §15.4 Render 상태. */
export enum RenderStatus {
  QUEUED = 'queued',
  RENDERING = 'rendering',
  DONE = 'done',
  FAILED = 'failed'
}

export const RENDER_STATUS_LABEL: Record<RenderStatus, string> = {
  [RenderStatus.QUEUED]: '대기 중',
  [RenderStatus.RENDERING]: '렌더링 중',
  [RenderStatus.DONE]: '완료',
  [RenderStatus.FAILED]: '실패'
}

export type ScrollMode = 'continuous' | 'slide'

export interface RenderParams {
  width: number
  fps: number
  scrollMode: ScrollMode
  viewportRatio: number // 세로/가로
  castCreatorId: number // 어느 성우 캐스트로 렌더할지
}

export interface RenderJob {
  id: number
  episodeId: number
  status: RenderStatus
  params: RenderParams
  progress: number // 0~100
  createdAt: string // UTC ISO
  outputUrl?: string
  durationMs?: number
  error?: string
}
