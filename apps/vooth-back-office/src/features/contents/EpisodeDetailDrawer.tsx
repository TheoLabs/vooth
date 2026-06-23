import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Drawer, Empty, Popconfirm, Space, Spin, Tag, Typography } from 'antd';
import { useEpisode, useUpdateEpisode } from './useEpisodes';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { ContentThumb } from './ContentThumb';
import {
  EpisodeFormFields,
  type EpisodeFormHandle,
  type EpisodeFormPayload,
} from './EpisodeFormFields';
import { uploadImage } from '../../api/file.api';
import type { AdminEpisode, UpdateEpisodeInput } from '../../api/episode.api';

interface EpisodeDetailDrawerProps {
  contentId: number;
  /** 조회할 회차 id (null 이면 닫힘) */
  episodeId: number | null;
  deleting?: boolean;
  onClose: () => void;
  onDelete: (episode: AdminEpisode) => void;
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

export function EpisodeDetailDrawer({
  contentId,
  episodeId,
  deleting = false,
  onClose,
  onDelete,
}: EpisodeDetailDrawerProps) {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { data: episode, isLoading } = useEpisode(contentId, episodeId);
  const update = useUpdateEpisode(contentId);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const formRef = useRef<EpisodeFormHandle>(null);

  // 다른 회차를 열거나 닫으면 항상 보기 모드로 초기화
  useEffect(() => {
    setMode('view');
  }, [episodeId]);

  const saveEdit = async () => {
    if (!episode) return;
    const payload = formRef.current?.getPayload();
    if (!payload) return;

    const input = buildUpdateInput(episode, payload);
    const hasNewThumb = Boolean(payload.thumbnailFile);
    if (Object.keys(input).length === 0 && !hasNewThumb) {
      message.info('변경된 내용이 없습니다.');
      setMode('view');
      return;
    }
    try {
      if (payload.thumbnailFile) {
        input.thumbnailFileId = await uploadImage(payload.thumbnailFile, 'episodes/thumbnail');
        input.thumbnailCropBox = payload.cropBox ?? { x: 0, y: 0, w: 1, h: 1 };
      }
      await update.mutateAsync({ id: episode.id, input });
      message.success('회차를 수정했습니다.');
      setMode('view');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '회차 수정에 실패했습니다.');
    }
  };

  const extra =
    episode && mode === 'view' ? (
      <Space>
        <Button onClick={() => setMode('edit')}>수정</Button>
        <Popconfirm
          title="이 회차를 삭제할까요?"
          okText="삭제"
          cancelText="취소"
          okButtonProps={{ danger: true, loading: deleting }}
          onConfirm={() => onDelete(episode)}
        >
          <Button danger>삭제</Button>
        </Popconfirm>
        <Button
          type="primary"
          onClick={() => navigate(`/contents/${contentId}/episodes/${episode.id}/cuts`)}
        >
          컷 관리
        </Button>
      </Space>
    ) : mode === 'edit' ? (
      <Space>
        <Button onClick={() => setMode('view')} disabled={update.isPending}>
          취소
        </Button>
        <Button type="primary" onClick={saveEdit} loading={update.isPending}>
          저장
        </Button>
      </Space>
    ) : undefined;

  return (
    <Drawer
      title={mode === 'edit' ? '회차 수정' : '회차 정보'}
      open={episodeId != null}
      onClose={onClose}
      maskClosable={false}
      width={420}
      extra={extra}
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : !episode ? (
        <Empty description="회차를 불러오지 못했습니다." />
      ) : mode === 'edit' ? (
        <EpisodeFormFields ref={formRef} target={episode} />
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

/** 원본과 비교해 변경된 필드만. 썸네일 업로드(thumbnailFileId)는 호출부에서 처리. */
function buildUpdateInput(
  target: AdminEpisode,
  payload: EpisodeFormPayload,
): UpdateEpisodeInput {
  const input: UpdateEpisodeInput = {};
  if (payload.title !== target.title) input.title = payload.title;
  if (payload.isFree !== target.isFree) input.isFree = payload.isFree;
  if (payload.expectedPublishOn !== (target.expectedPublishOn ?? null)) {
    input.expectedPublishOn = payload.expectedPublishOn;
  }
  return input;
}
