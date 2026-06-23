import { Space, Typography } from 'antd';
import { ContentStatus, CONTENT_STATUS_LABEL } from '@vooth/shared';
import { CONTENT_STATUS_DOT } from './content.types';

/** 작품 상태 표시 — 색 점 + 중립 텍스트(목록·상세 공통). */
export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Space size={6}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: CONTENT_STATUS_DOT[status],
          flex: 'none',
        }}
      />
      <Typography.Text>{CONTENT_STATUS_LABEL[status]}</Typography.Text>
    </Space>
  );
}
