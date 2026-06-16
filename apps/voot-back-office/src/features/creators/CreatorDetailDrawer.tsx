import {
  Avatar,
  Descriptions,
  Drawer,
  Empty,
  List,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { avatarColor, type Creator } from './creator.types';

interface CreatorDetailDrawerProps {
  creator: Creator | null;
  open: boolean;
  onClose: () => void;
}

/** UTC ISO 타임스탬프를 로컬 타임존 문자열로 변환한다. */
function formatLocal(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function CreatorDetailDrawer({ creator, open, onClose }: CreatorDetailDrawerProps) {
  if (!creator) {
    return <Drawer open={open} onClose={onClose} maskClosable={false} width={460} />;
  }

  return (
    <Drawer
      title="성우 상세"
      placement="right"
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={460}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 프로필 헤더 */}
        <Space align="center" size="middle">
          <Avatar size={64} style={{ backgroundColor: avatarColor(creator.nickname), fontSize: 24 }}>
            {creator.nickname.slice(0, 1)}
          </Avatar>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {creator.nickname}
            </Typography.Title>
            <Typography.Text type="secondary">{creator.email}</Typography.Text>
          </div>
        </Space>

        {/* 핵심 지표 */}
        <Space size="large" style={{ width: '100%' }}>
          <Statistic title="참여 작품" value={creator.castingCount} suffix="편" />
          <Statistic title="녹음 회차" value={creator.episodeCount} suffix="화" />
        </Space>

        {/* 기본 정보 */}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="가입일">{formatLocal(creator.joinedAt)}</Descriptions.Item>
          <Descriptions.Item label="소개">{creator.bio}</Descriptions.Item>
        </Descriptions>

        {/* 최근 참여 작품 */}
        <div>
          <Typography.Text strong>최근 참여 작품</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {creator.recentWorks.length ? (
              <List
                size="small"
                bordered
                dataSource={creator.recentWorks}
                renderItem={(work) => (
                  <List.Item>
                    <List.Item.Meta
                      title={work.title}
                      description={
                        <Space size={4}>
                          <Tag>{work.role}</Tag>
                          <Typography.Text type="secondary">{work.episodes}화</Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="참여 작품이 없습니다." />
            )}
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
