import { Space, Typography } from 'antd';
import type { EpisodeStatus } from '@vooth/shared';
import { EPISODE_STATUS_DOT, EPISODE_STATUS_LABEL } from './episode.types';

export function EpisodeStatusBadge({ status }: { status: EpisodeStatus }) {
  return (
    <Space size={6}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: EPISODE_STATUS_DOT[status],
          flex: 'none',
        }}
      />
      <Typography.Text>{EPISODE_STATUS_LABEL[status]}</Typography.Text>
    </Space>
  );
}
