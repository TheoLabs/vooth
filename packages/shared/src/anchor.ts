/**
 * 타임라인 앵커가 "무엇"을 기준으로 거는지. 값은 문자열 enum(append-only).
 * 풀 앵커 모델: 요소(Line/SoundEffect/CutEffect)는 같은 컷 안의 다른 요소(또는 컷 기준점)에 앵커한다.
 */
export enum AnchorType {
  LINE = 'line', // 다른 대사
  // 추가 예정(요소가 생기면 append): CUT_START(컷 기준점·targetId 없음), SOUND_EFFECT, CUT_EFFECT
}

/** 대상 요소의 시작/끝 중 어디를 기준으로 거는지. */
export enum AnchorEdge {
  START = 'start',
  END = 'end',
}

export interface Anchor {
  type: AnchorType;
  targetId: number;
  edge: AnchorEdge;
  offsetMs: number;
}
