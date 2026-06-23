/**
 * 회차(Episode) 표시용 상수. 상태/라벨은 @vooth/shared 를 따른다.
 */
import { EpisodeStatus, EPISODE_STATUS_LABEL } from '@vooth/shared';

export { EpisodeStatus, EPISODE_STATUS_LABEL };

/** 상태별 점 색상(차분한 톤). */
export const EPISODE_STATUS_DOT: Record<EpisodeStatus, string> = {
  [EpisodeStatus.DRAFT]: '#94a3b8',
  [EpisodeStatus.READY]: '#1677ff',
  [EpisodeStatus.RECORDING]: '#2f54eb',
  [EpisodeStatus.REVIEWING]: '#722ed1',
  [EpisodeStatus.APPROVED]: '#13c2c2',
  [EpisodeStatus.SCHEDULED]: '#fa8c16',
  [EpisodeStatus.PUBLISHED]: '#52c41a',
};

export const EPISODE_STATUS_OPTIONS = (Object.values(EpisodeStatus) as EpisodeStatus[]).map(
  (value) => ({ value, label: EPISODE_STATUS_LABEL[value] }),
);
