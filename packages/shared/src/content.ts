/**
 * 콘텐츠 상태 lifecycle. 값은 문자열 enum.
 * 2단계 검수: 회차(EpisodeReview) 검수가 모두 끝나면 콘텐츠가 REVIEWING(콘텐츠 단위 최종 검수)으로,
 * 검수자가 수동으로 APPROVED 처리.
 * 🔒 불변식: PUBLISHED 도달 이후엔 발행 이전 상태로 회귀하지 않는다(화이트리스트가 구조적으로 차단).
 */
export enum ContentStatus {
  DRAFT = 'draft', // 초안
  RECORDING = 'recording', // 녹음 중
  REVIEWING = 'reviewing', // 검수 중
  APPROVED = 'approved', // 검수 완료
  SCHEDULED = 'scheduled', // 발행 대기(발행 예정일 예약)
  PUBLISHED = 'published', // 발행
  ARCHIVED = 'archived', // 보관
}

/**
 * 허용 상태 전이(화이트리스트).
 * - DRAFT→RECORDING : 회차 하나라도 녹음 진입(자동). 역방향 없음.
 * - RECORDING↔REVIEWING : 모든 회차 검수 완료/회귀(자동 롤업).
 * - REVIEWING→APPROVED : 검수자 수동 완료. APPROVED→REVIEWING : 재검수.
 * - APPROVED↔SCHEDULED : 발행 예정일 설정/해제.
 * - SCHEDULED→PUBLISHED : 스케줄러(예정일 도달).
 * - PUBLISHED↔ARCHIVED : 관리자 수동. (발행 이전으로의 회귀 경로는 없음)
 */
export const CONTENT_STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.DRAFT]: [ContentStatus.RECORDING],
  [ContentStatus.RECORDING]: [ContentStatus.REVIEWING],
  [ContentStatus.REVIEWING]: [ContentStatus.RECORDING, ContentStatus.APPROVED],
  [ContentStatus.APPROVED]: [ContentStatus.REVIEWING, ContentStatus.SCHEDULED],
  [ContentStatus.SCHEDULED]: [ContentStatus.APPROVED, ContentStatus.PUBLISHED],
  [ContentStatus.PUBLISHED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [ContentStatus.PUBLISHED],
};

/** from → to 전이가 허용되는지. */
export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 콘텐츠 상태 한글 라벨(표시/에러용). */
export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: '초안',
  [ContentStatus.RECORDING]: '녹음 중',
  [ContentStatus.REVIEWING]: '검수 중',
  [ContentStatus.APPROVED]: '검수 완료',
  [ContentStatus.SCHEDULED]: '발행 대기',
  [ContentStatus.PUBLISHED]: '발행',
  [ContentStatus.ARCHIVED]: '보관',
};
