import { useNavigate } from 'react-router-dom';
import { Button, Drawer, Empty, Spin, Tag, Typography } from 'antd';
import { useEpisode } from './useEpisodes';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { ContentThumb } from './ContentThumb';

interface EpisodeDetailDrawerProps {
  contentId: number;
  /** 조회할 회차 id (null 이면 닫힘) */
  episodeId: number | null;
  onClose: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0' }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div style={{ textAlign: 'right' }}>{children}</div>
    </div>
  );
}

export function EpisodeDetailDrawer({ contentId, episodeId, onClose }: EpisodeDetailDrawerProps) {
  const navigate = useNavigate();
  const { data: episode, isLoading } = useEpisode(contentId, episodeId);

  return (
    <Drawer
      title="회차 정보"
      open={episodeId != null}
      onClose={onClose}
      maskClosable={false}
      width={420}
      extra={
        episode ? (
          <Button
            type="primary"
            onClick={() =>
              navigate(`/contents/${contentId}/episodes/${episode.id}/cuts`)
            }
          >
            컷 관리
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : !episode ? (
        <Empty description="회차를 불러오지 못했습니다." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <ContentThumb
              url={episode.thumbnailUrl}
              crop={episode.thumbnailCropBox ?? undefined}
              title={episode.title}
              width={96}
              height={128}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {episode.chapter}화
              </Typography.Text>
              <Typography.Title level={4} style={{ margin: '4px 0 8px' }}>
                {episode.title}
              </Typography.Title>
              <EpisodeStatusBadge status={episode.status} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <Field label="회차 번호">{episode.chapter}화</Field>
            <Field label="무료 공개">
              {episode.isFree ? <Tag color="green">무료</Tag> : <Tag>유료</Tag>}
            </Field>
            <Field label="발행 예정일">{formatDate(episode.expectedPublishOn)}</Field>
          </div>
        </div>
      )}
    </Drawer>
  );
}
