import { useMemo, useState } from 'react';
import {
  App as AntApp,
  Button,
  ColorPicker,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag as AntTag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { numberParam, stringParam, useUrlQuery } from '../../hooks/useUrlQuery';
import { TAG_PRESET_COLORS } from './tag.types';
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from './useTags';
import type { AdminTag, UpdateTagInput } from '../../api/tag.api';

const DEFAULT_COLOR = TAG_PRESET_COLORS[0];

/** UTC ISO → 로컬 날짜(YYYY-MM-DD). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface EditState {
  /** null = 추가, AdminTag = 수정 */
  target: AdminTag | null;
  open: boolean;
}

export function TagsPage() {
  const { message } = AntApp.useApp();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [q, setQ] = useUrlQuery({
    q: stringParam(),
    page: numberParam(1),
    limit: numberParam(DEFAULT_PAGE_SIZE),
  });
  const [searchInput, setSearchInput] = useState(q.q);

  const query = useMemo(
    () => ({
      searchKey: q.q ? ('name' as const) : undefined,
      searchValue: q.q || undefined,
      page: q.page,
      limit: q.limit,
    }),
    [q.q, q.page, q.limit],
  );

  const { data, isLoading } = useTags(query);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // 막대 바 기준 최대 사용 수(현재 페이지 기준 상대 비율)
  const maxUsage = useMemo(() => Math.max(1, ...items.map((t) => t.usageCount)), [items]);

  // 추가/수정 모달
  const [edit, setEdit] = useState<EditState>({ target: null, open: false });
  const [nameDraft, setNameDraft] = useState('');
  const [colorDraft, setColorDraft] = useState(DEFAULT_COLOR);

  const openAdd = () => {
    setEdit({ target: null, open: true });
    setNameDraft('');
    setColorDraft(DEFAULT_COLOR);
  };

  const openEdit = (tag: AdminTag) => {
    setEdit({ target: tag, open: true });
    setNameDraft(tag.name);
    setColorDraft(tag.color);
  };

  const closeEdit = () => setEdit({ target: null, open: false });

  const submitEdit = async () => {
    const name = nameDraft.trim();
    if (!name) {
      message.warning('태그명을 입력해주세요.');
      return;
    }

    if (edit.target) {
      // 수정: 변경된 필드만 전송 — 바뀐 게 없으면 종료
      const changed: UpdateTagInput = {};
      if (name !== edit.target.name) changed.name = name;
      if (colorDraft !== edit.target.color) changed.color = colorDraft;
      if (!changed.name && !changed.color) {
        message.info('변경된 내용이 없습니다.');
        return;
      }
      try {
        await updateTag.mutateAsync({ id: edit.target.id, input: changed });
        message.success('태그를 수정했습니다.');
        closeEdit();
      } catch (e) {
        message.error(e instanceof Error ? e.message : '태그 수정에 실패했습니다.');
      }
      return;
    }

    // 추가: POST /admins/tags
    try {
      await createTag.mutateAsync({ name, color: colorDraft });
      setQ({ page: 1 });
      message.success('태그를 추가했습니다.');
      closeEdit();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '태그 추가에 실패했습니다.');
    }
  };

  const removeTag = (tag: AdminTag) => {
    deleteTag.mutate(tag.id, {
      onSuccess: () => message.success('태그를 삭제했습니다.'),
      onError: (e) => message.error(e.message),
    });
  };

  const columns: ColumnsType<AdminTag> = [
    {
      title: '태그',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, tag) => <AntTag color={tag.color}>{name}</AntTag>,
    },
    {
      title: '색상',
      dataIndex: 'color',
      key: 'color',
      width: 160,
      render: (color: string) => (
        <Space size={8}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: 4,
              background: color,
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
          <Typography.Text code style={{ fontSize: 12 }}>
            {color.toUpperCase()}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '사용 콘텐츠 수',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 240,
      sorter: (a, b) => a.usageCount - b.usageCount,
      defaultSortOrder: 'descend',
      render: (v: number, tag) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round((v / maxUsage) * 100)}%`,
                height: '100%',
                borderRadius: 999,
                background: tag.color,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <Typography.Text style={{ fontSize: 12, minWidth: 44, textAlign: 'right' }}>
            {v.toLocaleString()}개
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (iso: string) => formatDate(iso),
    },
    {
      title: '관리',
      key: 'actions',
      width: 140,
      render: (_, tag) => (
        <Space size={4}>
          <Button size="small" onClick={() => openEdit(tag)}>
            수정
          </Button>
          <Popconfirm
            title="이 태그를 삭제하시겠습니까?"
            description={
              tag.usageCount > 0 ? `${tag.usageCount}개 콘텐츠에서 사용 중입니다.` : undefined
            }
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true, loading: deleteTag.isPending }}
            onConfirm={() => removeTag(tag)}
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
      <Typography.Title level={3} style={{ margin: 0 }}>
        태그 관리
      </Typography.Title>

      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => setQ({ q: v, page: 1 })}
        placeholder="태그명 검색"
        actions={
          <Button type="primary" onClick={openAdd}>
            태그 추가
          </Button>
        }
      />

      <FullHeightTable<AdminTag>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={items}
        total={total}
        pagination={{
          current: q.page,
          pageSize: q.limit,
          total,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== q.limit) {
              setQ({ limit: nextSize, page: 1 });
            } else {
              setQ({ page: nextPage });
            }
          },
        }}
      />

      <Modal
        title={edit.target ? '태그 수정' : '태그 추가'}
        open={edit.open}
        maskClosable={false}
        onCancel={closeEdit}
        onOk={() => void submitEdit()}
        okText={edit.target ? '수정' : '추가'}
        cancelText="취소"
        confirmLoading={createTag.isPending || updateTag.isPending}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <div>
            <span className="form-label">태그명</span>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="예: 로맨스"
              maxLength={20}
              onPressEnter={() => void submitEdit()}
            />
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <span className="form-label">색상</span>
              <div>
                <ColorPicker
                  value={colorDraft}
                  onChange={(c) => setColorDraft(c.toHexString())}
                  presets={[{ label: '추천', colors: TAG_PRESET_COLORS }]}
                  showText
                  disabledAlpha
                />
              </div>
            </div>
            <div>
              <span className="form-label">미리보기</span>
              <div style={{ paddingTop: 4 }}>
                <AntTag color={colorDraft}>{nameDraft.trim() || '태그'}</AntTag>
              </div>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
