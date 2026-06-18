/**
 * 콘텐츠 상태 lifecycle. 값은 문자열 enum.
 * 2단계 검수: 회차(EpisodeReview) 검수가 모두 끝나면 콘텐츠가 REVIEWING(콘텐츠 단위 최종 검수)으로,
 * 검수자가 수동으로 APPROVED 처리.
 * 🔒 불변식: PUBLISHED 도달 이후엔 발행 이전 상태로 회귀하지 않는다(화이트리스트가 구조적으로 차단).
 */
export enum ContentStatus {
  DRAFT = 'draft', // 초안
  READY = 'ready', // 녹음 대기
  RECORDING = 'recording', // 녹음 중
  REVIEWING = 'reviewing', // 검수 중
  APPROVED = 'approved', // 검수 완료
  SCHEDULED = 'scheduled', // 발행 대기(발행 예정일 예약)
  PUBLISHED = 'published', // 발행
  ARCHIVED = 'archived', // 보관
}

/**
 * 허용 상태 전이(화이트리스트).
 * - DRAFT→READY : 관리자 수동(초안 작업 완료 = 운영자 책임).
 * - READY→DRAFT : 관리자 수동(초안으로 회귀해 재편집).
 * - READY→RECORDING : 성우 1명이라도 콘텐츠 소속 에피소드 녹음 진입(자동).
 * - RECORDING↔REVIEWING : 모든 회차 검수 완료/회귀(자동 롤업).
 * - REVIEWING→APPROVED : 검수자 수동 완료. APPROVED→REVIEWING : 재검수.
 * - APPROVED↔SCHEDULED : 발행 예정일 설정/해제.
 * - SCHEDULED→PUBLISHED : 스케줄러(예정일 도달).
 * - PUBLISHED↔ARCHIVED : 관리자 수동. (발행 이전으로의 회귀 경로는 없음)
 */
export const CONTENT_STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.DRAFT]: [ContentStatus.READY],
  [ContentStatus.READY]: [ContentStatus.RECORDING, ContentStatus.DRAFT],
  [ContentStatus.RECORDING]: [ContentStatus.REVIEWING],
  [ContentStatus.REVIEWING]: [ContentStatus.RECORDING, ContentStatus.APPROVED],
  [ContentStatus.APPROVED]: [ContentStatus.REVIEWING, ContentStatus.SCHEDULED],
  [ContentStatus.SCHEDULED]: [ContentStatus.APPROVED, ContentStatus.PUBLISHED],
  [ContentStatus.PUBLISHED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [ContentStatus.PUBLISHED],
};

/** from → to 전이가 허용되는지(전체 화이트리스트 — 시스템/자동 포함). */
export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 사람(관리자/검수자)이 직접 트리거할 수 있는 전이만 추린 부분집합.
 * 반드시 CONTENT_STATUS_TRANSITIONS 의 부분집합이어야 한다.
 * 제외 대상:
 * - READY→RECORDING        : 성우 녹음 진입(자동)
 * - RECORDING↔REVIEWING     : 검수 롤업/회귀(자동)
 * - APPROVED↔SCHEDULED      : expectedPublishOn 설정/해제(데이터 기반 — update 로 처리)
 * - SCHEDULED→PUBLISHED     : 예정일 발행(스케줄러)
 * 포함: READY→DRAFT(녹음 시작 전, 초안으로 회귀해 재편집).
 */
export const CONTENT_MANUAL_TRANSITIONS: Partial<Record<ContentStatus, ContentStatus[]>> = {
  [ContentStatus.DRAFT]: [ContentStatus.READY],
  [ContentStatus.READY]: [ContentStatus.DRAFT],
  [ContentStatus.REVIEWING]: [ContentStatus.APPROVED],
  [ContentStatus.APPROVED]: [ContentStatus.REVIEWING],
  [ContentStatus.PUBLISHED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [ContentStatus.PUBLISHED],
};

/** from → to 가 수동으로 허용되는 전이인지(자동·스케줄러·데이터 전이는 차단). */
export function canManualTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_MANUAL_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 콘텐츠 상태 한글 라벨(표시/에러용). */
export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: '초안',
  [ContentStatus.READY]: '녹음 대기',
  [ContentStatus.RECORDING]: '녹음 중',
  [ContentStatus.REVIEWING]: '검수 중',
  [ContentStatus.APPROVED]: '검수 완료',
  [ContentStatus.SCHEDULED]: '발행 대기',
  [ContentStatus.PUBLISHED]: '발행',
  [ContentStatus.ARCHIVED]: '보관',
};
