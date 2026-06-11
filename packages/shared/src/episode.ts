/** 회차 상태. 값은 진행 순서(편집중 < … < 발행)대로 숫자. */
export enum EpisodeStatus {
  DRAFT = 10, // 편집중
  READY = 20, // 녹음 대기
  RECORDING = 30, // 녹음 중
  REVIEW = 40, // 검수 대기
  APPROVED = 50, // 검수 완료
  PUBLISHED = 60, // 발행
}

/**
 * 허용 상태 전이(화이트리스트). 임의 점프를 막고, 반려 경로를 포함한다.
 * - REVIEW → RECORDING : 반려(재녹음)
 */
export const EPISODE_STATUS_TRANSITIONS: Record<EpisodeStatus, EpisodeStatus[]> = {
  [EpisodeStatus.DRAFT]: [EpisodeStatus.READY],
  [EpisodeStatus.READY]: [EpisodeStatus.RECORDING],
  [EpisodeStatus.RECORDING]: [EpisodeStatus.REVIEW],
  [EpisodeStatus.REVIEW]: [EpisodeStatus.APPROVED, EpisodeStatus.RECORDING],
  [EpisodeStatus.APPROVED]: [EpisodeStatus.PUBLISHED],
  [EpisodeStatus.PUBLISHED]: [],
};

/** from → to 전이가 허용되는지. */
export function canTransitionEpisode(from: EpisodeStatus, to: EpisodeStatus): boolean {
  return EPISODE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
