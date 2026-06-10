import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import { FullHeightTable } from '../../components/FullHeightTable';
import { useContentStore } from '../../features/content/ContentStore';
import { WEBTOON_STATUS_META } from '../../features/content/contentTypes';
import type { Webtoon, WebtoonStatus } from '../../features/content/contentTypes';
import '../../components/DataTable.css';

const STATUS_OPTIONS = (Object.keys(WEBTOON_STATUS_META) as WebtoonStatus[]).map((s) => ({
  value: s,
  label: WEBTOON_STATUS_META[s].label,
}));

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
}

interface WebtoonRow extends Webtoon {
  episodeCount: number;
}

export function WebtoonsPage() {
  const navigate = useNavigate();
  const { webtoons, episodesByWebtoon, createWebtoon } = useContentStore();

  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState('');
  const [statusFilter, setStatusFilter] = useState<WebtoonStatus[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<{ title: string; description?: string; status: WebtoonStatus }>();

  const rows = useMemo<WebtoonRow[]>(() => {
    return webtoons
      .filter((w) => (applied ? w.title.includes(applied) : true))
      .filter((w) => (statusFilter.length ? statusFilter.includes(w.status) : true))
      .map((w) => ({ ...w, episodeCount: episodesByWebtoon(w.id).length }));
  }, [webtoons, applied, statusFilter, episodesByWebtoon]);

  const columns: ColumnsType<WebtoonRow> = [
    { title: '제목', dataIndex: 'title', key: 'title', width: 220 },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v?: string) => v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: '회차', dataIndex: 'episodeCount', key: 'episodeCount', width: 80, align: 'center' },
    {
      title: '등장인물',
      dataIndex: 'characters',
      key: 'characters',
      width: 90,
      align: 'center',
      render: (_: unknown, row) => row.characters.length,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WebtoonStatus) => <Tag color={WEBTOON_STATUS_META[s].color}>{WEBTOON_STATUS_META[s].label}</Tag>,
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (v: string) => formatDate(v),
    },
  ];

  const submitCreate = async () => {
    const values = await form.validateFields();
    createWebtoon({ title: values.title.trim(), description: values.description?.trim(), status: values.status });
    message.success('작품이 등록되었습니다.');
    setCreateOpen(false);
    form.resetFields();
  };

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
          if (v.trim() === '') setApplied('');
        }}
        onSearch={() => setApplied(keyword.trim())}
      />

      <FilterBar>
        <FilterField label="상태">
          <Select<WebtoonStatus[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v ?? [])}
            options={STATUS_OPTIONS}
            maxTagCount="responsive"
          />
        </FilterField>
      </FilterBar>

      <FullHeightTable<WebtoonRow>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={rows}
        onRow={(record) => ({
          onClick: () => navigate(`/content/webtoons/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{ pageSize: 30, showSizeChanger: true, pageSizeOptions: [30, 50, 100] }}
      />

      <Modal
        title="작품 등록"
        open={createOpen}
        onOk={submitCreate}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        okText="등록"
        cancelText="취소"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'DRAFT' as WebtoonStatus }}>
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요.' }]}>
            <Input placeholder="작품 제목" maxLength={200} />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea placeholder="작품 설명" rows={3} maxLength={500} />
          </Form.Item>
          <Form.Item name="status" label="상태">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
