/**
 * 회차(Episode) 상태 lifecycle. 값은 문자열 enum.
 * 멀티버전에선 사실상 (회차 × 캐스팅) 진행의 롤업이며, 자동 전이 배선은 녹음/EpisodeCasting 연동 시 연결한다.
 * Content 상태 머신과 동일 흐름: 검수 완료(APPROVED) → 발행 대기(SCHEDULED) → 발행(PUBLISHED).
 */
export enum EpisodeStatus {
  DRAFT = 'draft', // 초안(편집 중)
  READY = 'ready', // 녹음 대기
  RECORDING = 'recording', // 녹음 중
  REVIEWING = 'reviewing', // 검수 중
  APPROVED = 'approved', // 검수 완료
  SCHEDULED = 'scheduled', // 발행 대기(expectedPublishOn 예약)
  PUBLISHED = 'published', // 발행
}

/**
 * 허용 상태 전이(화이트리스트).
 * - DRAFT→READY : 관리자 수동(편집 완료).
 * - READY→RECORDING : 성우 1명이라도 녹음 진입(자동).
 * - RECORDING→REVIEWING : 검수 요청/롤업.
 * - REVIEWING↔RECORDING : 검수 회귀(재녹음).
 * - REVIEWING→APPROVED : 검수 완료(롤업/검수자). APPROVED→REVIEWING : 재검수.
 * - APPROVED↔SCHEDULED : expectedPublishOn 설정/해제.
 * - SCHEDULED→PUBLISHED : 예정일 도달(스케줄러).
 */
export const EPISODE_STATUS_TRANSITIONS: Record<EpisodeStatus, EpisodeStatus[]> = {
  [EpisodeStatus.DRAFT]: [EpisodeStatus.READY],
  [EpisodeStatus.READY]: [EpisodeStatus.RECORDING],
  [EpisodeStatus.RECORDING]: [EpisodeStatus.REVIEWING],
  [EpisodeStatus.REVIEWING]: [EpisodeStatus.RECORDING, EpisodeStatus.APPROVED],
  [EpisodeStatus.APPROVED]: [EpisodeStatus.REVIEWING, EpisodeStatus.SCHEDULED],
  [EpisodeStatus.SCHEDULED]: [EpisodeStatus.APPROVED, EpisodeStatus.PUBLISHED],
  [EpisodeStatus.PUBLISHED]: [],
};

/** from → to 전이가 허용되는지. */
export function canTransitionEpisode(from: EpisodeStatus, to: EpisodeStatus): boolean {
  return EPISODE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 녹음(재녹음 포함)이 허용되는 상태. 검수 중(REVIEWING)에도 재녹음 가능해야 한다.
 * 첫 녹음은 READY 상태에서 시작되어 RECORDING 으로 자동 전이된다.
 * (APPROVED 이후에는 재녹음하려면 재검수(→REVIEWING→RECORDING)를 거친다.)
 */
export const EPISODE_RECORDABLE_STATUSES: EpisodeStatus[] = [
  EpisodeStatus.READY,
  EpisodeStatus.RECORDING,
  EpisodeStatus.REVIEWING,
];

/** 회차 상태 한글 라벨(표시/에러용). */
export const EPISODE_STATUS_LABEL: Record<EpisodeStatus, string> = {
  [EpisodeStatus.DRAFT]: '초안',
  [EpisodeStatus.READY]: '녹음 대기',
  [EpisodeStatus.RECORDING]: '녹음 중',
  [EpisodeStatus.REVIEWING]: '검수 중',
  [EpisodeStatus.APPROVED]: '검수 완료',
  [EpisodeStatus.SCHEDULED]: '발행 대기',
  [EpisodeStatus.PUBLISHED]: '발행',
};
