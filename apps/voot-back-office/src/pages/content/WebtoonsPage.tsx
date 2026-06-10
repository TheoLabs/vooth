import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input, Modal, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContentStatus } from '@vooth/shared';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import { FullHeightTable } from '../../components/FullHeightTable';
import { useContents } from '../../features/contents/useContents';
import { useCreateContent } from '../../features/contents/useCreateContent';
import { useTags } from '../../features/tags/useTags';
import { CONTENT_STATUS_META, type ContentListItem, type ContentTag } from '../../api/contents.api';
import { TAG_COLOR_ANTD } from '../../features/content/contentTypes';
import { ThumbnailUpload } from '../../components/ThumbnailUpload';
import '../../components/DataTable.css';

const STATUS_OPTIONS = (Object.keys(CONTENT_STATUS_META) as ContentStatus[]).map((s) => ({
  value: s,
  label: CONTENT_STATUS_META[s].label,
}));

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;
/** 태그 피커가 전체 태그를 한 번에 받도록 넉넉한 limit. */
const TAG_PICKER_LIMIT = 100;
/** 이미지 업로드는 추후 — 등록 시 기본 placeholder 썸네일. */
const DEFAULT_THUMBNAIL = 'https://placehold.co/480x300?text=Cover';

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
}

export function WebtoonsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<{ title: string; description: string; thumbnailImageUrl: string; tagIds?: number[] }>();

  const { data, isFetching, isError, error } = useContents({
    page,
    limit,
    searchKey: applied ? 'title' : undefined,
    searchValue: applied || undefined,
    statuses: statusFilter,
  });

  // 등록 모달 태그 선택지(실제 태그 API).
  const { data: tagsData } = useTags({ page: DEFAULT_PAGE, limit: TAG_PICKER_LIMIT });
  const tagOptions = useMemo(
    () => (tagsData?.items ?? []).map((t) => ({ value: t.id, label: t.name })),
    [tagsData],
  );

  const createMutation = useCreateContent();

  const submitSearch = () => {
    setPage(DEFAULT_PAGE);
    setApplied(keyword.trim());
  };

  const submitCreate = async () => {
    const v = await form.validateFields();
    createMutation.mutate(
      {
        title: v.title.trim(),
        description: v.description.trim(),
        thumbnailImageUrl: v.thumbnailImageUrl.trim() || DEFAULT_THUMBNAIL,
        tagIds: v.tagIds ?? [],
      },
      {
        onSuccess: () => {
          message.success('작품이 등록되었습니다.');
          setCreateOpen(false);
          form.resetFields();
        },
        onError: (err) => message.error(err.message),
      },
    );
  };

  const columns: ColumnsType<ContentListItem> = [
    {
      title: '썸네일',
      dataIndex: 'thumbnailImageUrl',
      key: 'thumbnailImageUrl',
      width: 76,
      render: (url: string) => (
        <img
          src={url}
          alt=""
          style={{ width: 56, height: 34, objectFit: 'cover', borderRadius: 4, background: '#f0f0f0' }}
        />
      ),
    },
    { title: '제목', dataIndex: 'title', key: 'title', width: 220 },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v?: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ContentStatus) => <Tag color={CONTENT_STATUS_META[s].color}>{CONTENT_STATUS_META[s].label}</Tag>,
    },
    {
      title: '태그',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: ContentTag[]) => {
        if (!tags || tags.length === 0) return <Typography.Text type="secondary">—</Typography.Text>;
        const shown = tags.slice(0, 2);
        const rest = tags.slice(2);
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {shown.map((t) => (
              <Tag key={t.id} color={TAG_COLOR_ANTD[t.color]} style={{ marginInlineEnd: 0 }}>
                {t.name}
              </Tag>
            ))}
            {rest.length > 0 && (
              <Tooltip title={rest.map((t) => t.name).join(', ')}>
                <Tag style={{ marginInlineEnd: 0 }}>+{rest.length}</Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    { title: '수정일', dataIndex: 'updatedAt', key: 'updatedAt', width: 120, render: (v: string) => formatDate(v) },
  ];

  return (
    <div className="bo-page">
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          작품 관리
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          작품 등록
        </Button>
      </Space>

      <TableToolbar<'title'>
        fields={[{ value: 'title', label: '제목' }]}
        searchField="title"
        onSearchFieldChange={() => undefined}
        keyword={keyword}
        onKeywordChange={(v) => {
          setKeyword(v);
          if (v.trim() === '' && applied) {
            setPage(DEFAULT_PAGE);
            setApplied('');
          }
        }}
        onSearch={submitSearch}
      />

      <FilterBar>
        <FilterField label="상태">
          <Select<ContentStatus[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            value={statusFilter}
            onChange={(v) => {
              setPage(DEFAULT_PAGE);
              setStatusFilter(v ?? []);
            }}
            options={STATUS_OPTIONS}
            maxTagCount="responsive"
          />
        </FilterField>
      </FilterBar>

      {isError && (
        <Alert type="error" showIcon message="작품 목록을 불러오지 못했습니다." description={error?.message} />
      )}

      <FullHeightTable<ContentListItem>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        onRow={(record) => ({
          onClick: () => navigate(`/content/contents/${record.id}`, { state: { content: record } }),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [30, 50, 100],
        }}
        onChange={(pagination) => {
          const nextLimit = pagination.pageSize ?? DEFAULT_LIMIT;
          if (nextLimit !== limit) {
            setLimit(nextLimit);
            setPage(DEFAULT_PAGE);
          } else {
            setPage(pagination.current ?? DEFAULT_PAGE);
          }
        }}
      />

      <Modal
        title="작품 등록"
        open={createOpen}
        onOk={submitCreate}
        confirmLoading={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        okText="등록"
        cancelText="취소"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요.' }]}>
            <Input placeholder="작품 제목" maxLength={200} />
          </Form.Item>
          <Form.Item name="description" label="설명" rules={[{ required: true, message: '설명을 입력하세요.' }]}>
            <Input.TextArea placeholder="작품 설명" rows={3} maxLength={2000} />
          </Form.Item>
          <Form.Item
            name="thumbnailImageUrl"
            label="썸네일"
            rules={[{ required: true, message: '썸네일을 업로드하세요.' }]}
          >
            <ThumbnailUpload />
          </Form.Item>
          <Form.Item name="tagIds" label="태그">
            <Select mode="multiple" allowClear placeholder="태그 선택" options={tagOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
