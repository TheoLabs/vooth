/**
 * 태그(콘텐츠 분류용 마스터) — 현재 mock 데이터(core-api Tag 모듈 준비 전 UI/UX 확인용).
 * - 전역 태그 풀. 콘텐츠가 N:M 으로 참조하며, 연결의 소유는 Content(content_tag join).
 * - color 는 color-picker 로 직접 지정하는 hex 값으로 다룬다.
 * - usageCount 는 연결된 활성 콘텐츠 수의 파생 캐시(읽기 전용, 클라가 못 셋).
 */
export interface Tag {
  id: number;
  /** 태그명. 중복 불가 */
  name: string;
  /** hex 색상 (#RRGGBB) */
  color: string;
  /** 연결된 활성 콘텐츠 수 (파생 — 읽기 전용) */
  usageCount: number;
  /** 등록일(UTC ISO) */
  createdAt: string;
}

/** color-picker 프리셋 팔레트 */
export const TAG_PRESET_COLORS = [
  '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911',
];

export const MOCK_TAGS: Tag[] = [
  { id: 1, name: '로맨스', color: '#eb2f96', usageCount: 128, createdAt: '2025-11-02T01:00:00.000Z' },
  { id: 2, name: '판타지', color: '#722ed1', usageCount: 96, createdAt: '2025-11-05T01:00:00.000Z' },
  { id: 3, name: '액션', color: '#f5222d', usageCount: 74, createdAt: '2025-12-01T01:00:00.000Z' },
  { id: 4, name: '일상', color: '#52c41a', usageCount: 61, createdAt: '2025-12-10T01:00:00.000Z' },
  { id: 5, name: '스릴러', color: '#2f54eb', usageCount: 43, createdAt: '2026-01-08T01:00:00.000Z' },
  { id: 6, name: '코미디', color: '#faad14', usageCount: 39, createdAt: '2026-01-20T01:00:00.000Z' },
  { id: 7, name: '드라마', color: '#13c2c2', usageCount: 31, createdAt: '2026-02-14T01:00:00.000Z' },
  { id: 8, name: '무협', color: '#fa8c16', usageCount: 18, createdAt: '2026-03-03T01:00:00.000Z' },
  { id: 9, name: '학원', color: '#1677ff', usageCount: 12, createdAt: '2026-04-01T01:00:00.000Z' },
  { id: 10, name: '미스터리', color: '#a0d911', usageCount: 7, createdAt: '2026-05-09T01:00:00.000Z' },
];
