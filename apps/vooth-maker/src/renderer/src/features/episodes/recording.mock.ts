/**
 * 녹음/검수 도메인 MOCK 데이터.
 * ------------------------------------------------------------------
 * 전부 목(mock) 데이터다. core-api(`creators/*`) 연동 시 이 파일의 상수를
 * 실제 조회/뮤테이션으로 교체한다. 도메인 매핑(docs/content-domain-design.md):
 *   - Episode(회차) → Cut(컷, 이미지+위치) → Line(대사, characterId/text/position)
 *   - Recording(녹음 take) = (Line × creator), status RECORDED→REVIEW→APPROVED/REJECTED, 멀티테이크 허용
 *   - 검수(EpisodeReview) = (회차 × 성우) 단위, 성우 본인이 검수 요청
 *
 * 여기서 mock 은 "내(=로그인 성우) 작업분"만 다룬다. 따라서 한 라인당 내 take 들만 들고 있고,
 * 진행률은 (APPROVED/REVIEW/RECORDED 가 1개라도 있는 라인) / (전체 라인) 으로 본다.
 */

import { EPISODE_STATUS_LABEL, EPISODE_STATUS_VARIANT, type EpisodeStatus } from './episode.types'

export { EPISODE_STATUS_LABEL, EPISODE_STATUS_VARIANT }
export type { EpisodeStatus }

// ---- Recording(녹음 take) -----------------------------------------------------

/** docs §13.2 RecordingStatus 와 동일 의미(여기선 문자열로). */
export type RecordingStatus = 'RECORDED' | 'REVIEW' | 'APPROVED' | 'REJECTED'

export const RECORDING_STATUS_LABEL: Record<RecordingStatus, string> = {
  RECORDED: '녹음됨',
  REVIEW: '검수 중',
  APPROVED: '승인',
  REJECTED: '반려',
}

/** .take-badge--* className 접미사 (RecordingPage.css) */
export const RECORDING_STATUS_VARIANT: Record<RecordingStatus, string> = {
  RECORDED: 'recorded',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export interface RecordingTake {
  id: number
  status: RecordingStatus
  /** 녹음 길이(ms) */
  durationMs: number
  /** 제출/녹음 시각(UTC ISO) */
  recordedAt: string
  /** 채택된 take 인지 (LineTake.recordingId == 이 id) */
  selected: boolean
}

// ---- Cut / Line ---------------------------------------------------------------

export interface MockCharacter {
  id: number
  name: string
  /** UI 표시색 #RRGGBB (character.color) */
  color: string
}

export interface MockLine {
  id: number
  cutId: number
  position: number
  characterId: number
  text: string
  /** 내(로그인 성우) take 목록. 비어있으면 미녹음. */
  takes: RecordingTake[]
}

export interface MockCut {
  id: number
  position: number
  /** 컷 이미지 — mock 은 placeholder 색만 둔다(실제 imageUrl 대체 지점) */
  placeholderColor: string
  lines: MockLine[]
}

export interface MockEpisodeScript {
  episodeId: number
  characters: MockCharacter[]
  cuts: MockCut[]
}

// ---- Episode 상세(녹음 화면 헤더용) -------------------------------------------

export interface MockEpisodeMeta {
  id: number
  workId: number
  workTitle: string
  episodeNo: number
  title: string
  /** 내 배역(이 캐스팅에서 내가 맡은 캐릭터) */
  role: string
  status: EpisodeStatus
  /** 마지막 작업일(UTC ISO) */
  updatedAt: string
  dueDate: string
  /** 검수 반려 피드백(있으면 RECORDING 으로 회귀한 상태) */
  rejectionNote?: string
}

// ---- 작업 목록(내 배정 회차) --------------------------------------------------

export interface AssignedEpisode extends MockEpisodeMeta {
  /** 작품 썸네일 placeholder 색(실제 thumbnailUrl 대체 지점) */
  thumbColor: string
  totalLines: number
  /** 녹음 완료(=take 1개 이상 있는) 라인 수 */
  recordedLines: number
}

// ---- 검수 현황(EpisodeReview) -------------------------------------------------

export type ReviewStatus = 'REVIEWING' | 'APPROVED' | 'REJECTED'

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  REVIEWING: '검수 중',
  APPROVED: '승인',
  REJECTED: '반려',
}

export const REVIEW_STATUS_VARIANT: Record<ReviewStatus, string> = {
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export interface EpisodeReview {
  id: number
  episodeId: number
  workTitle: string
  episodeNo: number
  episodeTitle: string
  role: string
  status: ReviewStatus
  /** 검수 요청일(UTC ISO) */
  requestedAt: string
  /** 검수 처리일(승인/반려, UTC ISO) */
  resolvedAt?: string
  /** 반려 사유(REJECTED 일 때) */
  rejectionNote?: string
}

// ============================================================================
// MOCK 데이터
// ============================================================================

/** 작품/캐릭터 팔레트 (mock) */
const GARDEN_CHARS: MockCharacter[] = [
  { id: 101, name: '레이첼', color: '#ec4899' },
  { id: 102, name: '카일', color: '#3b82f6' },
  { id: 103, name: '내레이션', color: '#64748b' },
]
const REGRESS_CHARS: MockCharacter[] = [
  { id: 201, name: '아리아', color: '#f59e0b' },
  { id: 202, name: '황태자', color: '#6366f1' },
  { id: 203, name: '내레이션', color: '#64748b' },
]

function take(
  id: number,
  status: RecordingStatus,
  durationMs: number,
  recordedAt: string,
  selected = false,
): RecordingTake {
  return { id, status, durationMs, recordedAt, selected }
}

/**
 * 회차별 스크립트(컷/대사). 작업 목록의 episodeId 와 1:1.
 * 내(로그인 성우) 배역 라인에만 takes 가 붙는다. 상대역/내레이션 라인은 takes:[] (참고용 표시).
 */
export const MOCK_SCRIPTS: Record<number, MockEpisodeScript> = {
  // 회차 2: 달빛 정원 11화 — 녹음 중(일부 완료)
  2: {
    episodeId: 2,
    characters: GARDEN_CHARS,
    cuts: [
      {
        id: 2001,
        position: 1,
        placeholderColor: '#1e293b',
        lines: [
          {
            id: 20011,
            cutId: 2001,
            position: 1,
            characterId: 103,
            text: '달빛이 정원을 가득 메운 밤, 두 사람은 다시 마주쳤다.',
            takes: [],
          },
          {
            id: 20012,
            cutId: 2001,
            position: 2,
            characterId: 101,
            text: '…당신이 여기 있을 줄은 몰랐어요.',
            takes: [take(900121, 'APPROVED', 3200, '2026-06-15T22:10:00.000Z', true)],
          },
        ],
      },
      {
        id: 2002,
        position: 2,
        placeholderColor: '#334155',
        lines: [
          {
            id: 20021,
            cutId: 2002,
            position: 1,
            characterId: 102,
            text: '나도 그래. 그냥… 발이 이쪽으로 향했을 뿐이야.',
            takes: [],
          },
          {
            id: 20022,
            cutId: 2002,
            position: 2,
            characterId: 101,
            text: '그 말, 믿어도 되는 거죠?',
            takes: [
              take(900221, 'RECORDED', 2600, '2026-06-16T01:02:00.000Z'),
              take(900222, 'RECORDED', 2750, '2026-06-16T01:05:00.000Z', true),
            ],
          },
        ],
      },
      {
        id: 2003,
        position: 3,
        placeholderColor: '#475569',
        lines: [
          {
            id: 20031,
            cutId: 2003,
            position: 1,
            characterId: 101,
            text: '오늘은… 도망치지 않을게요.',
            takes: [],
          },
        ],
      },
    ],
  },

  // 회차 3: 회귀한 영애 5화 — 검수 반려(재녹음 필요)
  3: {
    episodeId: 3,
    characters: REGRESS_CHARS,
    cuts: [
      {
        id: 3001,
        position: 1,
        placeholderColor: '#3b0764',
        lines: [
          {
            id: 30011,
            cutId: 3001,
            position: 1,
            characterId: 201,
            text: '다시 눈을 떴을 때, 나는 열일곱으로 돌아와 있었다.',
            takes: [take(930111, 'APPROVED', 3400, '2026-06-15T10:00:00.000Z', true)],
          },
        ],
      },
      {
        id: 3002,
        position: 2,
        placeholderColor: '#581c87',
        lines: [
          {
            id: 30021,
            cutId: 3002,
            position: 1,
            characterId: 201,
            // 검수 반려 대상 라인
            text: '이번 생에는… 절대 같은 실수를 하지 않아.',
            takes: [take(930211, 'REJECTED', 2900, '2026-06-15T10:05:00.000Z', false)],
          },
          {
            id: 30022,
            cutId: 3002,
            position: 2,
            characterId: 202,
            text: '영애, 무슨 생각을 그리 골똘히 하시오?',
            takes: [],
          },
        ],
      },
    ],
  },

  // 회차 4: 회귀한 영애 4화 — 검수 중(모든 라인 제출 완료)
  4: {
    episodeId: 4,
    characters: REGRESS_CHARS,
    cuts: [
      {
        id: 4001,
        position: 1,
        placeholderColor: '#1e1b4b',
        lines: [
          {
            id: 40011,
            cutId: 4001,
            position: 1,
            characterId: 201,
            text: '황궁의 밤은 길고, 음모는 그보다 더 길었다.',
            takes: [take(940111, 'REVIEW', 3100, '2026-06-15T07:50:00.000Z', true)],
          },
          {
            id: 40012,
            cutId: 4001,
            position: 2,
            characterId: 202,
            text: '영애, 이 늦은 시각에 어인 일이오?',
            takes: [],
          },
        ],
      },
    ],
  },

  // 회차 5: 심해의 노래 1화 — 발행 완료(전부 승인)
  5: {
    episodeId: 5,
    characters: [
      { id: 301, name: '세이렌', color: '#0ea5e9' },
      { id: 302, name: '내레이션', color: '#64748b' },
    ],
    cuts: [
      {
        id: 5001,
        position: 1,
        placeholderColor: '#082f49',
        lines: [
          {
            id: 50011,
            cutId: 5001,
            position: 1,
            characterId: 301,
            text: '깊은 바다 아래, 나의 노래를 들어줄 이가 있을까.',
            takes: [take(950111, 'APPROVED', 3600, '2026-06-12T09:20:00.000Z', true)],
          },
        ],
      },
    ],
  },

  // 회차 1: 달빛 정원 12화 — 녹음 대기(아직 한 take 도 없음)
  1: {
    episodeId: 1,
    characters: GARDEN_CHARS,
    cuts: [
      {
        id: 1001,
        position: 1,
        placeholderColor: '#0f172a',
        lines: [
          {
            id: 10011,
            cutId: 1001,
            position: 1,
            characterId: 103,
            text: '비밀의 화원으로 통하는 문이 처음으로 열렸다.',
            takes: [],
          },
          {
            id: 10012,
            cutId: 1001,
            position: 2,
            characterId: 101,
            text: '여기였구나… 줄곧 찾던 곳이.',
            takes: [],
          },
        ],
      },
    ],
  },
}

/** 작업 목록(내 배정 회차) — MOCK_SCRIPTS 의 라인 수로 진행률 계산 */
function countLines(episodeId: number, role: string): { total: number; recorded: number } {
  const script = MOCK_SCRIPTS[episodeId]
  if (!script) return { total: 0, recorded: 0 }
  const myCharIds = new Set(
    script.characters.filter((c) => c.name === role).map((c) => c.id),
  )
  const myLines = script.cuts.flatMap((c) => c.lines).filter((l) => myCharIds.has(l.characterId))
  return {
    total: myLines.length,
    recorded: myLines.filter((l) => l.takes.length > 0).length,
  }
}

function buildAssigned(meta: Omit<AssignedEpisode, 'totalLines' | 'recordedLines'>): AssignedEpisode {
  const { total, recorded } = countLines(meta.id, meta.role)
  return { ...meta, totalLines: total, recordedLines: recorded }
}

export const MOCK_ASSIGNED_EPISODES: AssignedEpisode[] = [
  buildAssigned({
    id: 1,
    workId: 11,
    workTitle: '달빛 정원',
    episodeNo: 12,
    title: '비밀의 화원에서',
    role: '레이첼',
    status: 'READY',
    thumbColor: '#6366f1',
    updatedAt: '2026-06-15T02:00:00.000Z',
    dueDate: '2026-06-20T15:00:00.000Z',
  }),
  buildAssigned({
    id: 2,
    workId: 11,
    workTitle: '달빛 정원',
    episodeNo: 11,
    title: '엇갈린 약속',
    role: '레이첼',
    status: 'RECORDING',
    thumbColor: '#6366f1',
    updatedAt: '2026-06-16T01:20:00.000Z',
    dueDate: '2026-06-18T15:00:00.000Z',
  }),
  buildAssigned({
    id: 3,
    workId: 22,
    workTitle: '회귀한 영애',
    episodeNo: 5,
    title: '두 번째 삶',
    role: '아리아',
    status: 'RECORDING',
    thumbColor: '#a855f7',
    updatedAt: '2026-06-16T03:10:00.000Z',
    dueDate: '2026-06-17T15:00:00.000Z',
    rejectionNote: '2번 컷 대사의 호흡이 빠릅니다. 감정선 살려 재녹음 부탁드려요.',
  }),
  buildAssigned({
    id: 4,
    workId: 22,
    workTitle: '회귀한 영애',
    episodeNo: 4,
    title: '황궁의 밤',
    role: '아리아',
    status: 'REVIEWING',
    thumbColor: '#a855f7',
    updatedAt: '2026-06-15T08:00:00.000Z',
    dueDate: '2026-06-14T15:00:00.000Z',
  }),
  buildAssigned({
    id: 5,
    workId: 33,
    workTitle: '심해의 노래',
    episodeNo: 1,
    title: '첫 만남',
    role: '세이렌',
    status: 'PUBLISHED',
    thumbColor: '#0ea5e9',
    updatedAt: '2026-06-12T09:30:00.000Z',
    dueDate: '2026-06-10T15:00:00.000Z',
  }),
]

export function getAssignedEpisode(id: number): AssignedEpisode | undefined {
  return MOCK_ASSIGNED_EPISODES.find((e) => e.id === id)
}

/** 검수 현황(EpisodeReview) — (회차 × 성우) 단위 */
export const MOCK_EPISODE_REVIEWS: EpisodeReview[] = [
  {
    id: 9001,
    episodeId: 4,
    workTitle: '회귀한 영애',
    episodeNo: 4,
    episodeTitle: '황궁의 밤',
    role: '아리아',
    status: 'REVIEWING',
    requestedAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 9002,
    episodeId: 3,
    workTitle: '회귀한 영애',
    episodeNo: 5,
    episodeTitle: '두 번째 삶',
    role: '아리아',
    status: 'REJECTED',
    requestedAt: '2026-06-14T22:00:00.000Z',
    resolvedAt: '2026-06-15T09:30:00.000Z',
    rejectionNote: '2번 컷 대사의 호흡이 빠릅니다. 감정선 살려 재녹음 부탁드려요.',
  },
  {
    id: 9003,
    episodeId: 5,
    workTitle: '심해의 노래',
    episodeNo: 1,
    episodeTitle: '첫 만남',
    role: '세이렌',
    status: 'APPROVED',
    requestedAt: '2026-06-11T05:00:00.000Z',
    resolvedAt: '2026-06-12T09:30:00.000Z',
  },
]
