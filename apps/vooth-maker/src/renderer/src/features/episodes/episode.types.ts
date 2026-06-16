/**
 * 성우(CREATOR) 에게 배정된 회차(Episode) 도메인 — 전부 목(mock) 데이터.
 * - vooth-maker 는 녹음 앱. 성우는 자신에게 배정된 회차를 녹음하고 검수를 요청한다.
 * - episode.status 전이: DRAFT → READY → RECORDING → REVIEWING → PUBLISHED.
 *   (검수 반려 시 REVIEWING → RECORDING 으로 되돌아오며 피드백이 붙는다.)
 * - core-api(creators/*) 연동 시 이 파일의 MOCK 을 실제 조회로 교체한다.
 */

export type EpisodeStatus = 'READY' | 'RECORDING' | 'REVIEWING' | 'PUBLISHED';

export interface Episode {
  id: number;
  workId: number;
  workTitle: string;
  episodeNo: number;
  title: string;
  /** 배역 */
  role: string;
  status: EpisodeStatus;
  /** 전체 컷(대사) 수 */
  totalCuts: number;
  /** 녹음 완료한 컷 수 */
  recordedCuts: number;
  /** 마감일(UTC ISO) */
  dueDate: string;
  /** 최근 갱신(UTC ISO) */
  updatedAt: string;
  /** 검수 반려 피드백(있으면 RECORDING 으로 되돌아온 상태) */
  rejectionNote?: string;
}

export const EPISODE_STATUS_LABEL: Record<EpisodeStatus, string> = {
  READY: '녹음 대기',
  RECORDING: '녹음 중',
  REVIEWING: '검수 중',
  PUBLISHED: '발행 완료',
};

/** 상태별 pill className 접미사 (home.css 의 .status-pill--* 와 매칭) */
export const EPISODE_STATUS_VARIANT: Record<EpisodeStatus, string> = {
  READY: 'ready',
  RECORDING: 'recording',
  REVIEWING: 'reviewing',
  PUBLISHED: 'published',
};

export const EPISODE_STATUS_ORDER: EpisodeStatus[] = [
  'READY',
  'RECORDING',
  'REVIEWING',
  'PUBLISHED',
];

// ---- mock 데이터 ------------------------------------------------------------

export const MOCK_EPISODES: Episode[] = [
  {
    id: 1,
    workId: 11,
    workTitle: '달빛 정원',
    episodeNo: 12,
    title: '비밀의 화원에서',
    role: '레이첼',
    status: 'READY',
    totalCuts: 48,
    recordedCuts: 0,
    dueDate: '2026-06-20T15:00:00.000Z',
    updatedAt: '2026-06-15T02:00:00.000Z',
  },
  {
    id: 2,
    workId: 11,
    workTitle: '달빛 정원',
    episodeNo: 11,
    title: '엇갈린 약속',
    role: '레이첼',
    status: 'RECORDING',
    totalCuts: 52,
    recordedCuts: 33,
    dueDate: '2026-06-18T15:00:00.000Z',
    updatedAt: '2026-06-16T01:20:00.000Z',
  },
  {
    id: 3,
    workId: 22,
    workTitle: '회귀한 영애',
    episodeNo: 5,
    title: '두 번째 삶',
    role: '아리아',
    status: 'RECORDING',
    totalCuts: 40,
    recordedCuts: 40,
    dueDate: '2026-06-17T15:00:00.000Z',
    updatedAt: '2026-06-16T03:10:00.000Z',
    rejectionNote: '3번 컷 호흡이 빠릅니다. 감정선 살려 재녹음 부탁드려요.',
  },
  {
    id: 4,
    workId: 22,
    workTitle: '회귀한 영애',
    episodeNo: 4,
    title: '황궁의 밤',
    role: '아리아',
    status: 'REVIEWING',
    totalCuts: 45,
    recordedCuts: 45,
    dueDate: '2026-06-14T15:00:00.000Z',
    updatedAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 5,
    workId: 33,
    workTitle: '심해의 노래',
    episodeNo: 1,
    title: '첫 만남',
    role: '세이렌',
    status: 'PUBLISHED',
    totalCuts: 38,
    recordedCuts: 38,
    dueDate: '2026-06-10T15:00:00.000Z',
    updatedAt: '2026-06-12T09:30:00.000Z',
  },
];

export interface EpisodeSummary {
  status: EpisodeStatus;
  count: number;
}

export function summarize(episodes: Episode[]): EpisodeSummary[] {
  return EPISODE_STATUS_ORDER.map((status) => ({
    status,
    count: episodes.filter((e) => e.status === status).length,
  }));
}
