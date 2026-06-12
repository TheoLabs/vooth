export enum ContentStatus {
  PENDING = 'pending', // 편집중
  RECORDING = 'recording', // 녹음 대기
  SCHEDULED = 'scheduled', // 발행 예정(예약 대기)
  PUBLISHED = 'published', // 발행
  ARCHIVED = 'archived', // 아카이브
}

/**
 * 콘텐츠 상태 lifecycle(허용 전이 화이트리스트).
 * - PENDING ↔ RECORDING : 수동 양방향(편집중 ↔ 녹음 대기)
 * - RECORDING → SCHEDULED : 발행 예정 날짜가 채워지면 **자동**
 * - SCHEDULED → PUBLISHED : 예정일 도달 시 **스케줄러 자동**
 * - SCHEDULED → RECORDING : 예약 취소(수동)
 * - PUBLISHED ↔ ARCHIVED : 수동 양방향(발행 ↔ 아카이브)
 */
export const CONTENT_STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.PENDING]: [ContentStatus.RECORDING],
  [ContentStatus.RECORDING]: [ContentStatus.PENDING, ContentStatus.SCHEDULED],
  [ContentStatus.SCHEDULED]: [ContentStatus.RECORDING, ContentStatus.PUBLISHED],
  [ContentStatus.PUBLISHED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [ContentStatus.PUBLISHED],
};

/** from → to 전이가 허용되는지. */
export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 콘텐츠 상태 한글 라벨(에러 메시지/표시용). */
export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  [ContentStatus.PENDING]: '편집중',
  [ContentStatus.RECORDING]: '녹음 대기',
  [ContentStatus.SCHEDULED]: '발행 예정',
  [ContentStatus.PUBLISHED]: '발행',
  [ContentStatus.ARCHIVED]: '아카이브',
};

/**
 * 태그 색상 팔레트(의미 키). 표현(presentation) 관심사라 DB 테이블이 아닌 enum 으로 관리한다.
 * 백엔드는 이 값을 검증(@IsEnum)·저장만 하고, 실제 렌더링 색은 프론트가 매핑한다.
 * (AntD 토큰 등 UI 라이브러리 네이밍에 비종속)
 */
export enum TagColor {
  RED = 'RED',
  ORANGE = 'ORANGE',
  GOLD = 'GOLD',
  GREEN = 'GREEN',
  CYAN = 'CYAN',
  BLUE = 'BLUE',
  INDIGO = 'INDIGO',
  PURPLE = 'PURPLE',
  MAGENTA = 'MAGENTA',
  GRAY = 'GRAY',
}
