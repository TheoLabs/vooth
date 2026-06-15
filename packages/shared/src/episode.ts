/**
 * 회차 상태. 값은 진행 순서(편집중 < … < 발행)대로 숫자.
 * 검수(승인/반려)는 회차 단위가 아니라 (회차×성우 캐스팅) 단위 EpisodeReview 가 담당한다.
 * episode.status 의 REVIEWING 은 "한 캐스팅이라도 검수 요청됨"의 롤업이며, 회차 자체에 APPROVED 는 없다.
 * (50 은 과거 APPROVED 자리 — 회차 단위 승인 제거로 비워둠)
 */
export enum EpisodeStatus {
  DRAFT = 10, // 편집중
  READY = 20, // 녹음 대기
  RECORDING = 30, // 녹음 중
  REVIEWING = 40, // 검수 중(한 캐스팅이라도 검수 요청)
  PUBLISHED = 60, // 발행
}

/**
 * 허용 상태 전이(화이트리스트). 임의 점프를 막는다.
 * - RECORDING → REVIEWING : 첫 캐스팅 검수 요청
 * - REVIEWING → RECORDING : 검수 요청이 모두 해제됨(채택본 삭제 등)
 * - REVIEWING → PUBLISHED  : 발행
 */
export const EPISODE_STATUS_TRANSITIONS: Record<EpisodeStatus, EpisodeStatus[]> = {
  [EpisodeStatus.DRAFT]: [EpisodeStatus.READY],
  [EpisodeStatus.READY]: [EpisodeStatus.RECORDING],
  [EpisodeStatus.RECORDING]: [EpisodeStatus.REVIEWING],
  [EpisodeStatus.REVIEWING]: [EpisodeStatus.RECORDING, EpisodeStatus.PUBLISHED],
  [EpisodeStatus.PUBLISHED]: [],
};

/** from → to 전이가 허용되는지. */
export function canTransitionEpisode(from: EpisodeStatus, to: EpisodeStatus): boolean {
  return EPISODE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
