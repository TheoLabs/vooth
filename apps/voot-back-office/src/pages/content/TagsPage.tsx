import { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Tag as AntTag, Typography, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { TagColor } from '@vooth/shared';
import { TableToolbar } from '../../components/TableToolbar';
import { FullHeightTable } from '../../components/FullHeightTable';
import { useTags } from '../../features/tags/useTags';
import { useCreateTag, useDeleteTag, useUpdateTag } from '../../features/tags/useTagMutations';
import {
  TAG_COLOR_ANTD,
  TAG_COLOR_LABEL,
  TAG_COLOR_VALUES,
} from '../../features/content/contentTypes';
import type { TagListItem } from '../../api/tags.api';
import '../../components/DataTable.css';

const COLOR_OPTIONS = TAG_COLOR_VALUES.map((c) => ({
  value: c,
  label: <AntTag color={TAG_COLOR_ANTD[c]}>{TAG_COLOR_LABEL[c]}</AntTag>,
}));

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

export function TagsPage() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState('');
  // 단일 정렬만 지원(멀티 정렬 미고려).
  const [sort, setSort] = useState<{ field: 'name' | 'usageCount'; order: 'ASC' | 'DESC' } | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TagListItem | null>(null);
  const [form] = Form.useForm<{ name: string; color: TagColor }>();

  const { data, isFetching, isError, error } = useTags({
    page,
    limit,
    searchKey: applied ? 'name' : undefined,
    searchValue: applied || undefined,
    sort: sort?.field,
    order: sort?.order,
  });

  /** 현재 정렬 상태를 AntD 컬럼 sortOrder 로 변환. */
  const sortOrderOf = (field: 'name' | 'usageCount') =>
    sort?.field === field ? (sort.order === 'ASC' ? ('ascend' as const) : ('descend' as const)) : null;

  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const submitSearch = () => {
    setPage(DEFAULT_PAGE);
    setApplied(keyword.trim());
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', color: TAG_COLOR_VALUES[0] });
    setOpen(true);
  };

  const openEdit = (tag: TagListItem) => {
    setEditing(tag);
    form.setFieldsValue({ name: tag.name, color: tag.color });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    form.resetFields();
  };

  const submit = async () => {
    const v = await form.validateFields();
    const name = v.name.trim();

    if (editing) {
      // 기존값과 다른 필드만 전송한다.
      const patch: { name?: string; color?: TagColor } = {};
      if (name !== editing.name) patch.name = name;
      if (v.color !== editing.color) patch.color = v.color;

      if (Object.keys(patch).length === 0) {
        message.info('변경된 내용이 없습니다.');
        closeModal();
        return;
      }

      updateMutation.mutate(
        { id: editing.id, payload: patch },
        {
          onSuccess: () => {
            message.success('태그가 수정되었습니다.');
            closeModal();
          },
          onError: (err) => message.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        { name, color: v.color },
        {
          onSuccess: () => {
            message.success('태그가 등록되었습니다.');
            closeModal();
          },
          onError: (err) => message.error(err.message),
        },
      );
    }
  };

  const handleDelete = (tag: TagListItem) => {
    deleteMutation.mutate(tag.id, {
      onSuccess: () => message.success('태그가 삭제되었습니다.'),
      onError: (err) => message.error(err.message),
    });
  };

  const columns: ColumnsType<TagListItem> = [
    {
      title: '태그',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortOrderOf('name'),
      render: (_: string, row) => <AntTag color={TAG_COLOR_ANTD[row.color]}>{row.name}</AntTag>,
    },
    {
      title: '사용 작품 수',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 130,
      align: 'center',
      sorter: true,
      sortOrder: sortOrderOf('usageCount'),
    },
    {
      title: '액션',
      key: 'actions',
      width: 160,
      render: (_: unknown, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            수정
          </Button>
          <Popconfirm
            title="태그를 삭제할까요?"
            icon={<ExclamationCircleFilled style={{ color: '#ff4d4f' }} />}
            description={
              <div style={{ maxWidth: 260 }}>
                {row.usageCount > 0 ? (
                  <>
                    이 태그가 연결된 <b>{row.usageCount}개 작품</b>에서 태그가 <b>함께 제거</b>됩니다.
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                  </>
                ) : (
                  '삭제하면 되돌릴 수 없습니다.'
                )}
              </div>
            }
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            onConfirm={() => handleDelete(row)}
          >
            <Button size="small" danger>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bo-page">
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          태그 관리
        </Typography.Title>
        <Button type="primary" onClick={openCreate}>
          태그 등록
        </Button>
      </Space>

      <TableToolbar<'name'>
        fields={[{ value: 'name', label: '태그명' }]}
        searchField="name"
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

      {isError && (
        <Alert type="error" showIcon message="태그 목록을 불러오지 못했습니다." description={error?.message} />
      )}

      <FullHeightTable<TagListItem>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [30, 50, 100],
        }}
        onChange={(pagination, _filters, sorter) => {
          // 단일 정렬만 사용한다.
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          const sortField: 'name' | 'usageCount' | null =
            s?.field === 'name' ? 'name' : s?.field === 'usageCount' ? 'usageCount' : null;
          const nextSort =
            s?.order && sortField
              ? { field: sortField, order: s.order === 'ascend' ? ('ASC' as const) : ('DESC' as const) }
              : null;
          const sortChanged = JSON.stringify(nextSort) !== JSON.stringify(sort);
          setSort(nextSort);

          const nextLimit = pagination.pageSize ?? DEFAULT_LIMIT;
          if (nextLimit !== limit) {
            setLimit(nextLimit);
            setPage(DEFAULT_PAGE);
          } else if (sortChanged) {
            // 정렬이 바뀌면 1페이지로.
            setPage(DEFAULT_PAGE);
          } else {
            setPage(pagination.current ?? DEFAULT_PAGE);
          }
        }}
      />

      <Modal
        title={editing ? '태그 수정' : '태그 등록'}
        open={open}
        onOk={submit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        okText={editing ? '저장' : '등록'}
        cancelText="취소"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="태그명" rules={[{ required: true, message: '태그명을 입력하세요.' }]}>
            <Input placeholder="태그명" maxLength={30} />
          </Form.Item>
          <Form.Item name="color" label="색상" rules={[{ required: true }]}>
            <Select options={COLOR_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
