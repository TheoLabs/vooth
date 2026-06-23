/**
 * 작품(콘텐츠) 화면 상수/헬퍼.
 * 데이터 타입은 API 응답(`AdminContent`, api/content.api.ts)을 그대로 사용한다.
 */
import { ContentStatus, CONTENT_STATUS_LABEL } from '@vooth/shared';

/** 상태 표시용 점(dot) 색상(hex). 칩 대신 점+텍스트로 차분하게 표기. */
export const CONTENT_STATUS_DOT: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: '#94a3b8',
  [ContentStatus.READY]: '#1677ff',
  [ContentStatus.RECORDING]: '#2f54eb',
  [ContentStatus.REVIEWING]: '#722ed1',
  [ContentStatus.APPROVED]: '#13c2c2',
  [ContentStatus.SCHEDULED]: '#faad14',
  [ContentStatus.PUBLISHED]: '#52c41a',
  [ContentStatus.ARCHIVED]: '#cbd5e1',
};

export const CONTENT_STATUS_OPTIONS = Object.values(ContentStatus).map((value) => ({
  value,
  label: CONTENT_STATUS_LABEL[value],
}));

/** 썸네일 없을 때 플레이스홀더 그라데이션(제목 해시 기반). */
const THUMB_PAIRS = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#22d3ee'],
  ['#f43f5e', '#fb7185'],
  ['#f59e0b', '#fbbf24'],
  ['#10b981', '#34d399'],
  ['#8b5cf6', '#ec4899'],
];
export function thumbGradient(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = THUMB_PAIRS[hash % THUMB_PAIRS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
