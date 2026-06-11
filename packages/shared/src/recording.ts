/** 녹음(take) 상태. 값은 진행 순서대로 숫자. */
export enum RecordingStatus {
  RECORDED = 10, // 성우 녹음 제출
  REVIEW = 20, // 검수 대기
  APPROVED = 30, // 검수 통과(채택 가능)
  REJECTED = 40, // 반려(재녹음)
}

/**
 * 허용 상태 전이(화이트리스트).
 * - REVIEW → APPROVED/REJECTED : 검수 결과
 * - APPROVED/REJECTED → REVIEW : 재검수 회귀
 */
export const RECORDING_STATUS_TRANSITIONS: Record<RecordingStatus, RecordingStatus[]> = {
  [RecordingStatus.RECORDED]: [RecordingStatus.REVIEW],
  [RecordingStatus.REVIEW]: [RecordingStatus.APPROVED, RecordingStatus.REJECTED],
  [RecordingStatus.APPROVED]: [RecordingStatus.REVIEW],
  [RecordingStatus.REJECTED]: [RecordingStatus.REVIEW],
};

/** from → to 전이가 허용되는지. */
export function canTransitionRecording(from: RecordingStatus, to: RecordingStatus): boolean {
  return RECORDING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
