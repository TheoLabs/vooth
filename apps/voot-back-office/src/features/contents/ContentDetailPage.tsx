import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntApp,
  Button,
  Empty,
  Popconfirm,
  Progress,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContentStatus } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterSelect } from '../../components/FilterSelect';
import { ContentStatusBadge } from './ContentStatusBadge';
import { ContentThumb } from './ContentThumb';
import { ContentFormDrawer, type ContentFormPayload } from './ContentFormDrawer';
import { useContent, useDeleteContent, useUpdateContent } from './useContents';
import { uploadImage } from '../../api/file.api';
import type { UpdateContentInput } from '../../api/content.api';
import {
  EPISODE_STATUS_DOT,
  EPISODE_STATUS_LABEL,
  EPISODE_STATUS_OPTIONS,
  makeEpisodes,
  type Episode,
  type EpisodeStatus,
} from './episode.types';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

function EpisodeStatusBadge({ status }: { status: EpisodeStatus }) {
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

export function ContentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const numId = Number(id);

  const { data: content, isLoading } = useContent(numId);
  const update = useUpdateContent();
  const remove = useDeleteContent();

  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 회차는 mock(집계 API 준비 전). 작품 상태에 맞춰 적당한 회차 수를 생성.
  const episodes = useMemo<Episode[]>(() => {
    if (!content) return [];
    const count =
      content.status === ContentStatus.DRAFT || content.status === ContentStatus.READY
        ? 0
        : 8 + (content.id % 6);
    return makeEpisodes(content, count);
  }, [content]);

  // 회차 목록: 검색/필터/페이지네이션
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [epStatuses, setEpStatuses] = useState<EpisodeStatus[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredEpisodes = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    return episodes.filter((e) => {
      if (needle && !e.title.toLowerCase().includes(needle)) return false;
      if (epStatuses.length && !epStatuses.includes(e.status)) return false;
      return true;
    });
  }, [episodes, searchValue, epStatuses]);

  if (isLoading) {
    return (
      <div className="bo-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bo-page">
        <Empty description="작품을 불러오지 못했습니다.">
          <Button type="primary" onClick={() => navigate('/contents')}>
            목록으로
          </Button>
        </Empty>
      </div>
    );
  }

  const submitEdit = async (payload: ContentFormPayload) => {
    setSubmitting(true);
    try {
      const input: UpdateContentInput = {};
      if (payload.title !== content.title) input.title = payload.title;
      if (payload.description !== content.description) input.description = payload.description;
      if (!sameSet(payload.tagIds, content.tags.map((t) => t.id))) input.tagIds = payload.tagIds;
      if (payload.thumbnailFile) {
        input.thumbnailFileId = await uploadImage(payload.thumbnailFile);
        input.thumbnailCropBox = payload.cropBox ?? { x: 0, y: 0, w: 1, h: 1 };
      }

      if (Object.keys(input).length === 0) {
        message.info('변경된 내용이 없습니다.');
        return;
      }

      await update.mutateAsync({ id: content.id, input });
      message.success('작품을 수정했습니다.');
      setEditOpen(false);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '작품 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    remove.mutate(content.id, {
      onSuccess: () => {
        message.success('작품을 삭제했습니다.');
        navigate('/contents');
      },
      onError: (e) => message.error(e.message),
    });
  };

  const episodeColumns: ColumnsType<Episode> = [
    {
      title: '회차',
      dataIndex: 'no',
      key: 'no',
      width: 70,
      render: (no: number) => <Typography.Text strong>{no}화</Typography.Text>,
    },
    { title: '제목', dataIndex: 'title', key: 'title' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: EpisodeStatus) => <EpisodeStatusBadge status={s} />,
    },
    {
      title: '녹음 진행',
      key: 'progress',
      width: 200,
      render: (_, ep) => {
        const pct = ep.cutCount ? Math.round((ep.recordedCutCount / ep.cutCount) * 100) : 0;
        return (
          <Space size={8} style={{ width: '100%' }}>
            <Progress percent={pct} size="small" style={{ width: 110 }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {ep.recordedCutCount}/{ep.cutCount}컷
            </Typography.Text>
          </Space>
        );
      },
    },
    { title: '배정 성우', dataIndex: 'cast', key: 'cast', width: 110 },
    {
      title: '최근 수정',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (iso: string) => formatDate(iso),
    },
  ];

  return (
    <div className="bo-page">
      {/* 상단 바 */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Button type="text" onClick={() => navigate('/contents')}>
          ← 작품 목록
        </Button>
        <Space>
          <Button onClick={() => setEditOpen(true)}>수정</Button>
          <Popconfirm
            title="이 작품을 삭제하시겠습니까?"
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true, loading: remove.isPending }}
            onConfirm={handleDelete}
          >
            <Button danger>삭제</Button>
          </Popconfirm>
        </Space>
      </Space>

      {/* 헤더 카드 */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: 20,
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          flex: 'none',
        }}
      >
        <ContentThumb
          url={content.thumbnailUrl}
          crop={content.thumbnailCropBox}
          title={content.title}
          width={120}
          height={160}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <Space align="center" wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {content.title}
            </Typography.Title>
            <ContentStatusBadge status={content.status} />
          </Space>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {content.tags.map((t) => (
              <Tag key={t.id} color={t.color} style={{ marginInlineEnd: 0 }}>
                {t.name}
              </Tag>
            ))}
          </div>
          <Typography.Paragraph
            type="secondary"
            style={{ margin: '10px 0 0' }}
            ellipsis={{ rows: 2 }}
          >
            {content.description}
          </Typography.Paragraph>

          <Space size="large" wrap style={{ marginTop: 4 }}>
            <Typography.Text type="secondary">
              발행 예정일 <strong>{formatDate(content.expectedPublishOn)}</strong>
            </Typography.Text>
            <Typography.Text type="secondary">
              등록일 <strong>{formatDate(content.createdAt)}</strong>
            </Typography.Text>
          </Space>
        </div>
      </div>

      {/* 회차 목록 (남은 높이 채우고 테이블 내부 스크롤) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            회차 목록
          </Typography.Title>
          <Button onClick={() => message.info('회차 추가 화면은 준비 중입니다. (mock)')}>
            회차 추가
          </Button>
        </Space>

        <TableToolbar
          searchValue={searchInput}
          onSearchValueChange={setSearchInput}
          onSearch={(v) => {
            setSearchValue(v);
            setPage(1);
          }}
          placeholder="회차 제목 검색"
          filters={[
            {
              label: '상태',
              control: (
                <FilterSelect
                  value={epStatuses}
                  options={EPISODE_STATUS_OPTIONS}
                  dotColorOf={(v) => EPISODE_STATUS_DOT[v]}
                  onChange={(v) => {
                    setEpStatuses(v);
                    setPage(1);
                  }}
                />
              ),
            },
          ]}
        />

        <FullHeightTable<Episode>
          rowKey="id"
          columns={episodeColumns}
          dataSource={filteredEpisodes}
          total={filteredEpisodes.length}
          pagination={{
            current: page,
            pageSize,
            total: filteredEpisodes.length,
            onChange: (nextPage, nextSize) => {
              if (nextSize !== pageSize) {
                setPageSize(nextSize);
                setPage(1);
              } else {
                setPage(nextPage);
              }
            },
          }}
        />
      </div>

      <ContentFormDrawer
        open={editOpen}
        target={content}
        submitting={submitting}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
      />
    </div>
  );
}
