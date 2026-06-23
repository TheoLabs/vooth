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

/* ──────────────────────────── 앵커 (Anchor — 풀 앵커 타이밍) ────────────────────────────
 *
 * docs/domains/playback/index.html §03~04 + docs/domains/cut/index.html §03.
 * 보이스툰은 절대 시간(startAt)을 저장하지 않고, 모든 timed element 를 다른 요소(또는
 * CUT_START)에 앵커로 걸어 한 번만 저작한다. 버전(성우)별 음성 길이를 넣어 vooth-tool
 * 클라이언트가 실제 시간을 resolve 한다. 앵커 그래프는 같은 컷 내부 + DAG(비순환).
 *
 * 실제 배선: directors/* 응답에서 각 요소의 anchor 임베드(anchorType/Target/Edge/offset)로 대체.
 */

/** docs playback §04: anchorType = CUT_START | LINE | SOUND_EFFECT | CUT_EFFECT. */
export enum AnchorType {
  CUT_START = 'cut_start',
  LINE = 'line',
  SOUND_EFFECT = 'sound_effect',
  CUT_EFFECT = 'cut_effect'
}

export const ANCHOR_TYPE_LABEL: Record<AnchorType, string> = {
  [AnchorType.CUT_START]: '컷 시작',
  [AnchorType.LINE]: '대사',
  [AnchorType.SOUND_EFFECT]: '효과음',
  [AnchorType.CUT_EFFECT]: '시각효과'
}

/** docs playback §04 / cut §03: anchorEdge = START | END. */
export enum AnchorEdge {
  START = 'start',
  END = 'end'
}

export const ANCHOR_EDGE_LABEL: Record<AnchorEdge, string> = {
  [AnchorEdge.START]: '시작',
  [AnchorEdge.END]: '끝'
}

/**
 * docs playback §04 / cut §03 의 anchor(4 필드, timed element 공통 임베드).
 * null = 기본(순차: 직전 요소 END +0 / 효과는 CUT_START +0).
 */
export interface Anchor {
  type: AnchorType
  /** 같은 컷 내 형제 요소 id. CUT_START 면 null. (soft ref) */
  targetId: number | null
  edge: AnchorEdge
  /** 앵커 지점 기준 ±ms 오프셋. */
  offsetMs: number
}

/* ──────────────────────────── 시각효과 (CutEffect) ──────────────────────────── */

/**
 * docs playback §04 CutEffect.type / cut §03: CutEffectType(SHAKE/ZOOM/FLASH…).
 * @vooth/shared 예정 enum 의 미러(MOCK). 실제 배선: directors/* 의 CutEffectType DTO.
 */
export enum CutEffectType {
  SHAKE = 'shake', // 흔들림
  ZOOM = 'zoom', // 확대/축소
  FLASH = 'flash', // 번쩍임
  PAN = 'pan', // 이동
  FADE = 'fade', // 페이드 인/아웃
  BLUR = 'blur' // 블러
}

export const CUT_EFFECT_TYPE_LABEL: Record<CutEffectType, string> = {
  [CutEffectType.SHAKE]: '흔들림',
  [CutEffectType.ZOOM]: '줌',
  [CutEffectType.FLASH]: '플래시',
  [CutEffectType.PAN]: '팬(이동)',
  [CutEffectType.FADE]: '페이드',
  [CutEffectType.BLUR]: '블러'
}

/** 효과 lane 색(타임라인/배지). docs playback §03 의 fx=보라 계열. */
export const CUT_EFFECT_COLOR = '#7c3aed'
export const SOUND_EFFECT_COLOR = '#d97706'

/** 타입별 기본 params(추가 시 시드). docs: params 는 효과별 강도·방향·배율. */
export function defaultCutEffectParams(type: CutEffectType): CutEffectParams {
  switch (type) {
    case CutEffectType.SHAKE:
      return { intensity: 0.5, direction: 'horizontal' }
    case CutEffectType.ZOOM:
      return { scale: 1.2 }
    case CutEffectType.FLASH:
      return { intensity: 0.7 }
    case CutEffectType.PAN:
      return { direction: 'right' }
    case CutEffectType.BLUR:
      return { intensity: 0.4 }
    case CutEffectType.FADE:
      return {}
    default:
      return {}
  }
}

/** 타입별 기본 지속(ms). */
export function defaultCutEffectDuration(type: CutEffectType): number {
  switch (type) {
    case CutEffectType.FLASH:
      return 250
    case CutEffectType.SHAKE:
      return 500
    case CutEffectType.ZOOM:
      return 800
    case CutEffectType.PAN:
      return 1000
    case CutEffectType.FADE:
      return 600
    case CutEffectType.BLUR:
      return 500
    default:
      return 500
  }
}

/**
 * CutEffect.params — 효과별 파라미터(json). docs: 강도·방향·배율.
 * MOCK 이라 모든 효과를 아우르는 optional 필드 집합으로 둔다(실제로는 type 별 DTO).
 */
export interface CutEffectParams {
  /** 강도(0~1). SHAKE/FLASH/BLUR. */
  intensity?: number
  /** 방향. SHAKE/PAN. */
  direction?: 'horizontal' | 'vertical' | 'up' | 'down' | 'left' | 'right'
  /** 배율. ZOOM(>1 확대, <1 축소). */
  scale?: number
}

/** docs playback §04 / cut §03 CutEffect — 컷 owned child(시각효과, 공용·앵커). */
export interface CutEffect {
  id: number
  cutId: number
  type: CutEffectType
  params: CutEffectParams | null
  /** 지속(ms, 명시). docs: 컷 전체면 CUT_START 앵커 + duration=hold. */
  duration: number
  /** 타임라인 앵커. null = CUT_START +0(기본). */
  anchor: Anchor | null
  /** 컷 내 편집/렌더 순서. */
  order: number
}

/* ──────────────────────────── 효과음 (SoundEffect) ──────────────────────────── */

/** docs playback §04 / cut §03 SoundEffect — 컷 owned child(효과음, 공용·앵커). */
export interface SoundEffect {
  id: number
  cutId: number
  /** 효과음 오디오(File). MVP=컷마다 업로드. MOCK 이라 url placeholder. */
  audioFileId: number
  audioUrl: string // MOCK placeholder
  /** 길이(ms, 파생=오디오 길이). */
  audioDuration: number
  /** 표시 라벨("두둥!", "솨아아~"). */
  label: string | null
  /** 믹싱 음량(0~1, 기본 1.0). */
  volume: number
  /** 타임라인 앵커. null = CUT_START +0(기본). */
  anchor: Anchor | null
  /** 컷 내 편집 순서. */
  order: number
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
  /**
   * 타임라인 앵커(풀 앵커, docs playback §04). null = 직전 요소 END +0(순차 기본).
   * gapBeforeMs 는 이 앵커의 단순화 표현(직전 라인 END + gapBeforeMs)이며,
   * 실제 배선 시 anchor 임베드로 일원화한다. MOCK 에선 둘 다 보존한다.
   */
  anchor: Anchor | null
  /** (line × creator) 별 채택본. key=creatorId → recordingId. docs §13.3 LineTake */
  selectedTakeByCreator: Record<number, number>
}

/** docs §12.2 / §15. Cut — 컷. 이미지·holdMs·transition. */
export interface Cut {
  id: number
  episodeId: number
  position: number
  imageUrl: string // 원본(mock placeholder)
  imageWidth: number
  imageHeight: number
  holdMs: number // 마지막 대사 뒤 머무는 시간(docs holdOverride 의 단순화)
  transition: CutTransition
  lines: Line[]
  /** docs cut §03: 컷 owned child(효과음). 연출(vooth-tool)에서 추가/편집. */
  soundEffects: SoundEffect[]
  /** docs cut §03: 컷 owned child(시각효과). 연출(vooth-tool)에서 추가/편집. */
  cutEffects: CutEffect[]
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
