import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  App as AntApp,
  Button,
  Empty,
  Popconfirm,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EpisodeStatus } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterSelect } from '../../components/FilterSelect';
import {
  numberParam,
  stringArrayParam,
  stringParam,
  useUrlQuery,
} from '../../hooks/useUrlQuery';
import { ContentStatusBadge } from './ContentStatusBadge';
import { ContentThumb } from './ContentThumb';
import { CharactersTab } from './CharactersTab';
import { ContentFormDrawer, type ContentFormPayload } from './ContentFormDrawer';
import { EpisodeStatusBadge } from './EpisodeStatusBadge';
import { EpisodeDetailDrawer } from './EpisodeDetailDrawer';
import { EpisodeFormDrawer, type EpisodeFormPayload } from './EpisodeFormDrawer';
import { useContent, useDeleteContent, useUpdateContent } from './useContents';
import { useCreateEpisode, useEpisodes } from './useEpisodes';
import { uploadImage } from '../../api/file.api';
import type { UpdateContentInput } from '../../api/content.api';
import type { AdminEpisode } from '../../api/episode.api';
import { EPISODE_STATUS_DOT, EPISODE_STATUS_OPTIONS } from './episode.types';

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

type DetailTab = 'episodes' | 'characters';

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

  // 활성 탭은 URL 쿼리(?tab=)에 보관해 새로고침해도 유지한다.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: DetailTab = searchParams.get('tab') === 'characters' ? 'characters' : 'episodes';
  const setActiveTab = (tab: DetailTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  };

  // 회차 목록: 검색/필터/페이지네이션 (URL 동기화, 회차 prefix 'e.')
  const [eq, setEq] = useUrlQuery(
    {
      q: stringParam(),
      status: stringArrayParam<EpisodeStatus>(),
      page: numberParam(1),
      limit: numberParam(DEFAULT_PAGE_SIZE),
    },
    'e.',
  );
  const [searchInput, setSearchInput] = useState(eq.q);

  const episodeQuery = useMemo(
    () => ({
      searchKey: eq.q ? ('title' as const) : undefined,
      searchValue: eq.q || undefined,
      statuses: eq.status.length ? eq.status : undefined,
      page: eq.page,
      limit: eq.limit,
    }),
    [eq.q, eq.status, eq.page, eq.limit],
  );

  const { data: episodeData, isLoading: episodesLoading } = useEpisodes(numId, episodeQuery);
  const createEpisode = useCreateEpisode(numId);

  // 회차 생성 / 상세
  const [episodeFormOpen, setEpisodeFormOpen] = useState(false);
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);

  const submitCreateEpisode = async (payload: EpisodeFormPayload) => {
    setEpisodeSubmitting(true);
    try {
      const thumbnailFileId = payload.thumbnailFile
        ? await uploadImage(payload.thumbnailFile, 'episodes/thumbnail')
        : undefined;
      await createEpisode.mutateAsync({
        title: payload.title,
        chapter: payload.chapter,
        thumbnailFileId,
        thumbnailCropBox: thumbnailFileId ? (payload.cropBox ?? undefined) : undefined,
      });
      message.success('회차를 등록했습니다.');
      setEpisodeFormOpen(false);
      setEq({ page: 1 });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '회차 등록에 실패했습니다.');
    } finally {
      setEpisodeSubmitting(false);
    }
  };

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

  const episodeColumns: ColumnsType<AdminEpisode> = [
    {
      title: '회차',
      dataIndex: 'chapter',
      key: 'chapter',
      width: 70,
      render: (chapter: number) => <Typography.Text strong>{chapter}화</Typography.Text>,
    },
    {
      title: '제목',
      key: 'title',
      render: (_, ep) => (
        <Space>
          <ContentThumb
            url={ep.thumbnailUrl}
            crop={ep.thumbnailCropBox ?? undefined}
            title={ep.title}
            width={32}
            height={43}
          />
          <Typography.Text>{ep.title}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: EpisodeStatus) => <EpisodeStatusBadge status={s} />,
    },
    {
      title: '공개',
      dataIndex: 'isFree',
      key: 'isFree',
      width: 90,
      render: (isFree: boolean) =>
        isFree ? <Tag color="green">무료</Tag> : <Tag>유료</Tag>,
    },
    {
      title: '발행 예정일',
      dataIndex: 'expectedPublishOn',
      key: 'expectedPublishOn',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
  ];

  return (
    <div className="bo-page">
      {/* 상단 바 */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Button type="text" onClick={() => navigate('/contents')}>
          ← 작품 목록
        </Button>
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

      {/* 헤더: 작품 정보 카드 + 캐릭터 패널 */}
      {/* 작품 정보 카드 */}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Space align="center" wrap>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {content.title}
              </Typography.Title>
              <ContentStatusBadge status={content.status} />
            </Space>
            <Button size="small" onClick={() => setEditOpen(true)} style={{ flex: 'none' }}>
              수정
            </Button>
          </div>
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

      {/* 회차 목록 / 캐릭터 탭 (네비게이션) */}
      <Tabs
        className="bo-detail-tabs"
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as DetailTab)}
        items={[
          { key: 'episodes', label: '회차 목록' },
          { key: 'characters', label: '캐릭터' },
        ]}
      />

      {/* 탭 콘텐츠 */}
      <div className="bo-detail-tab-content">
        {activeTab === 'episodes' ? (
          <>
            <TableToolbar
              searchValue={searchInput}
              onSearchValueChange={setSearchInput}
              onSearch={(v) => setEq({ q: v, page: 1 })}
              placeholder="회차 제목 검색"
              filters={[
                {
                  label: '상태',
                  control: (
                    <FilterSelect
                      value={eq.status}
                      options={EPISODE_STATUS_OPTIONS}
                      dotColorOf={(v) => EPISODE_STATUS_DOT[v]}
                      onChange={(v) => setEq({ status: v, page: 1 })}
                    />
                  ),
                },
              ]}
              actions={
                <Button type="primary" onClick={() => setEpisodeFormOpen(true)}>
                  회차 추가
                </Button>
              }
            />

            <FullHeightTable<AdminEpisode>
              rowKey="id"
              loading={episodesLoading}
              columns={episodeColumns}
              dataSource={episodeData?.items}
              total={episodeData?.total}
              onRow={(ep) => ({
                onClick: () => setSelectedEpisodeId(ep.id),
                style: { cursor: 'pointer' },
              })}
              pagination={{
                current: eq.page,
                pageSize: eq.limit,
                total: episodeData?.total ?? 0,
                onChange: (nextPage, nextSize) => {
                  if (nextSize !== eq.limit) {
                    setEq({ limit: nextSize, page: 1 });
                  } else {
                    setEq({ page: nextPage });
                  }
                },
              }}
            />
          </>
        ) : (
          <CharactersTab contentId={content.id} />
        )}
      </div>

      <ContentFormDrawer
        open={editOpen}
        target={content}
        submitting={submitting}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
      />

      <EpisodeFormDrawer
        open={episodeFormOpen}
        defaultChapter={(episodeData?.total ?? 0) + 1}
        submitting={episodeSubmitting}
        onClose={() => setEpisodeFormOpen(false)}
        onSubmit={submitCreateEpisode}
      />

      <EpisodeDetailDrawer
        contentId={content.id}
        episodeId={selectedEpisodeId}
        onClose={() => setSelectedEpisodeId(null)}
      />
    </div>
  );
}
