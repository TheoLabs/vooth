import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContentStatus } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterSelect } from '../../components/FilterSelect';
import { ContentFormDrawer, type ContentFormPayload } from './ContentFormDrawer';
import { ContentStatusBadge } from './ContentStatusBadge';
import { ContentThumb } from './ContentThumb';
import { useContents, useCreateContent } from './useContents';
import { useTags } from '../tags/useTags';
import { uploadImage } from '../../api/file.api';
import { CONTENT_STATUS_DOT, CONTENT_STATUS_OPTIONS } from './content.types';
import type { AdminContent } from '../../api/content.api';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ContentsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [statuses, setStatuses] = useState<ContentStatus[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const createContent = useCreateContent();

  // 태그 필터 옵션(실제 태그)
  const { data: tagData } = useTags({ page: 1, limit: 100 });
  const tagOptions = (tagData?.items ?? []).map((t) => ({ value: t.id, label: t.name }));
  const tagColorById = useMemo(() => {
    const map = new Map<number, string>();
    (tagData?.items ?? []).forEach((t) => map.set(t.id, t.color));
    return map;
  }, [tagData]);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? ('title' as const) : undefined,
      searchValue: searchValue || undefined,
      statuses: statuses.length ? statuses : undefined,
      tagIds: tagIds.length ? tagIds : undefined,
      page,
      limit: pageSize,
    }),
    [searchValue, statuses, tagIds, page, pageSize],
  );

  const { data, isLoading } = useContents(query);

  const submitCreate = async (payload: ContentFormPayload) => {
    if (!payload.thumbnailFile) {
      message.warning('썸네일 이미지를 선택해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const thumbnailFileId = await uploadImage(payload.thumbnailFile);
      const cropBox = payload.cropBox ?? { x: 0, y: 0, w: 1, h: 1 };
      await createContent.mutateAsync({
        thumbnailFileId,
        thumbnailCropBox: cropBox,
        title: payload.title,
        description: payload.description,
        tagIds: payload.tagIds,
      });
      message.success('작품을 등록했습니다.');
      setFormOpen(false);
      setPage(1);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '작품 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AdminContent> = [
    {
      title: '작품',
      key: 'title',
      render: (_, c) => (
        <Space align="start">
          <ContentThumb url={c.thumbnailUrl} crop={c.thumbnailCropBox} title={c.title} width={40} height={54} />
          <div style={{ minWidth: 0, lineHeight: 1.4 }}>
            <Typography.Text strong>{c.title}</Typography.Text>
            <div
              style={{
                maxWidth: 360,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {c.description}
              </Typography.Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: ContentStatus) => <ContentStatusBadge status={status} />,
    },
    {
      title: '태그',
      key: 'tags',
      width: 220,
      render: (_, c) => (
        <span>
          {c.tags.length ? (
            c.tags.map((t) => (
              <Tag key={t.id} color={t.color} style={{ marginInlineEnd: 4 }}>
                {t.name}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )}
        </span>
      ),
    },
    {
      title: '발행 예정일',
      dataIndex: 'expectedPublishOn',
      key: 'expectedPublishOn',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (iso: string) => formatDate(iso),
    },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={3} style={{ margin: 0 }}>
        작품 관리
      </Typography.Title>

      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="작품 제목 검색"
        filters={[
          {
            label: '상태',
            control: (
              <FilterSelect
                value={statuses}
                options={CONTENT_STATUS_OPTIONS}
                dotColorOf={(v) => CONTENT_STATUS_DOT[v]}
                onChange={(v) => {
                  setStatuses(v);
                  setPage(1);
                }}
              />
            ),
          },
          {
            label: '태그',
            control: (
              <FilterSelect
                value={tagIds}
                options={tagOptions}
                dotColorOf={(v) => tagColorById.get(v)}
                onChange={(v) => {
                  setTagIds(v);
                  setPage(1);
                }}
              />
            ),
          },
        ]}
        actions={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            작품 등록
          </Button>
        }
      />

      <FullHeightTable<AdminContent>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        onRow={(content) => ({
          onClick: () => navigate(`/contents/${content.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
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

      <ContentFormDrawer
        open={formOpen}
        target={null}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={submitCreate}
      />
    </div>
  );
}
