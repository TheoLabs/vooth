/**
 * 회차(Episode) — 작품 상세에서 보여줄 mock 데이터.
 * core-api episode 모듈 준비 전 UI/UX 용. 상태 전이는 작품과 유사:
 * DRAFT → READY → RECORDING → REVIEWING → PUBLISHED (검수 반려 시 REVIEWING→RECORDING).
 */
import type { ContentStatus } from '@vooth/shared';

export type EpisodeStatus = 'DRAFT' | 'READY' | 'RECORDING' | 'REVIEWING' | 'PUBLISHED';

export interface Episode {
  id: number;
  contentId: number;
  /** 회차 번호 */
  no: number;
  title: string;
  status: EpisodeStatus;
  /** 컷(대사) 수 */
  cutCount: number;
  /** 녹음 완료 컷 수 */
  recordedCutCount: number;
  /** 배정 성우(활동명) */
  cast: string;
  /** 최근 수정(UTC ISO) */
  updatedAt: string;
}

export const EPISODE_STATUS_LABEL: Record<EpisodeStatus, string> = {
  DRAFT: '초안',
  READY: '녹음 대기',
  RECORDING: '녹음 중',
  REVIEWING: '검수 중',
  PUBLISHED: '발행',
};

export const EPISODE_STATUS_DOT: Record<EpisodeStatus, string> = {
  DRAFT: '#94a3b8',
  READY: '#1677ff',
  RECORDING: '#2f54eb',
  REVIEWING: '#722ed1',
  PUBLISHED: '#52c41a',
};

export const EPISODE_STATUSES: EpisodeStatus[] = [
  'DRAFT',
  'READY',
  'RECORDING',
  'REVIEWING',
  'PUBLISHED',
];

export const EPISODE_STATUS_OPTIONS = EPISODE_STATUSES.map((value) => ({
  value,
  label: EPISODE_STATUS_LABEL[value],
}));

const CAST_POOL = ['하리', '루나', '제이', '소이', '테오', '민트', '라온', '시아'];
const EP_TITLES = [
  '운명의 시작', '엇갈린 약속', '비밀의 화원', '두 번째 삶', '황궁의 밤',
  '첫 고백', '폭풍 전야', '재회', '되돌릴 수 없는', '마지막 선택',
];

/** 작품 상태에 맞춰 회차 상태를 결정적으로 분포시킨다. */
function statusFor(contentStatus: ContentStatus, idx: number, total: number): EpisodeStatus {
  switch (contentStatus) {
    case 'published':
    case 'archived':
      return 'PUBLISHED';
    case 'scheduled':
    case 'approved':
      return 'REVIEWING';
    case 'reviewing':
      return idx < total - 1 ? 'PUBLISHED' : 'REVIEWING';
    case 'recording':
      // 앞쪽은 완료, 가운데는 진행/검수, 끝은 대기
      if (idx < total * 0.4) return 'PUBLISHED';
      if (idx < total * 0.7) return 'REVIEWING';
      if (idx < total * 0.9) return 'RECORDING';
      return 'READY';
    case 'ready':
      return 'READY';
    default:
      return 'DRAFT';
  }
}

/** 작품의 회차 목록(mock). count 만큼 생성. */
export function makeEpisodes(
  content: { id: number; status: ContentStatus },
  count: number,
): Episode[] {
  return Array.from({ length: count }, (_, i) => {
    const no = i + 1;
    const status = statusFor(content.status, i, count);
    const cutCount = 30 + ((no * 7) % 30);
    const recordedCutCount =
      status === 'READY' || status === 'DRAFT'
        ? 0
        : status === 'RECORDING'
          ? Math.round(cutCount * 0.6)
          : cutCount;
    const day = String(1 + (no % 27)).padStart(2, '0');
    return {
      id: content.id * 1000 + no,
      contentId: content.id,
      no,
      title: EP_TITLES[i % EP_TITLES.length],
      status,
      cutCount,
      recordedCutCount,
      cast: CAST_POOL[i % CAST_POOL.length],
      updatedAt: `2026-06-${day}T02:00:00.000Z`,
    };
  });
}
