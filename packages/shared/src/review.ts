/**
 * 검수(EpisodeReview) 상태. 검수는 (회차 × 성우 캐스팅) 단위로, 성우가 직접 요청한다.
 * 값은 진행 순서대로 숫자.
 */
export enum ReviewStatus {
  REQUESTED = 10, // 검수 대기(성우가 검수 요청)
  APPROVED = 20, // 검수 통과
  REJECTED = 30, // 반려(사유 + 재요청 가능)
}

/**
 * 허용 상태 전이(화이트리스트).
 * - REQUESTED → APPROVED / REJECTED : 검수자 승인 / 반려
 * - REJECTED  → REQUESTED           : 성우 수정 후 재요청
 */
export const REVIEW_STATUS_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  [ReviewStatus.REQUESTED]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
  [ReviewStatus.APPROVED]: [],
  [ReviewStatus.REJECTED]: [ReviewStatus.REQUESTED],
};

/** from → to 전이가 허용되는지. */
export function canTransitionReview(from: ReviewStatus, to: ReviewStatus): boolean {
  return REVIEW_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
