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
import { MOCK_TAGS, TAG_PRESET_COLORS, type Tag } from './tag.types';

const DEFAULT_COLOR = TAG_PRESET_COLORS[0];

/** UTC ISO → 로컬 날짜(YYYY-MM-DD). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface EditState {
  /** null = 추가, Tag = 수정 */
  target: Tag | null;
  open: boolean;
}

export function TagsPage() {
  const { message } = AntApp.useApp();

  // 목 데이터 로컬 상태(추가/수정/삭제). core-api 연동 시 react-query 로 교체.
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 추가/수정 모달
  const [edit, setEdit] = useState<EditState>({ target: null, open: false });
  const [nameDraft, setNameDraft] = useState('');
  const [colorDraft, setColorDraft] = useState(DEFAULT_COLOR);

  const filtered = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    return needle ? tags.filter((t) => t.name.toLowerCase().includes(needle)) : tags;
  }, [tags, searchValue]);

  // 막대 바의 기준이 되는 최대 사용 수(상대 비율 계산용)
  const maxUsage = useMemo(() => Math.max(1, ...tags.map((t) => t.usageCount)), [tags]);

  const openAdd = () => {
    setEdit({ target: null, open: true });
    setNameDraft('');
    setColorDraft(DEFAULT_COLOR);
  };

  const openEdit = (tag: Tag) => {
    setEdit({ target: tag, open: true });
    setNameDraft(tag.name);
    setColorDraft(tag.color);
  };

  const closeEdit = () => setEdit({ target: null, open: false });

  const submitEdit = () => {
    const name = nameDraft.trim();
    if (!name) {
      message.warning('태그명을 입력해주세요.');
      return;
    }
    // 중복 검사(자기 자신 제외)
    const dup = tags.some(
      (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== edit.target?.id,
    );
    if (dup) {
      message.warning('이미 존재하는 태그명입니다.');
      return;
    }

    if (edit.target) {
      // 수정: 변경된 필드만 — 바뀐 게 없으면 종료
      if (name === edit.target.name && colorDraft === edit.target.color) {
        message.info('변경된 내용이 없습니다.');
        return;
      }
      setTags((prev) =>
        prev.map((t) => (t.id === edit.target!.id ? { ...t, name, color: colorDraft } : t)),
      );
      message.success('태그를 수정했습니다.');
    } else {
      // 추가
      const nextId = tags.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      setTags((prev) => [
        { id: nextId, name, color: colorDraft, usageCount: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setPage(1);
      message.success('태그를 추가했습니다.');
    }
    closeEdit();
  };

  const removeTag = (tag: Tag) => {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    message.success('태그를 삭제했습니다.');
  };

  const columns: ColumnsType<Tag> = [
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
            description={tag.usageCount > 0 ? `${tag.usageCount}개 콘텐츠에서 사용 중입니다.` : undefined}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
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
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="태그명 검색"
        actions={
          <Button type="primary" onClick={openAdd}>
            태그 추가
          </Button>
        }
      />

      <FullHeightTable<Tag>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        total={filtered.length}
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
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

      <Modal
        title={edit.target ? '태그 수정' : '태그 추가'}
        open={edit.open}
        maskClosable={false}
        onCancel={closeEdit}
        onOk={submitEdit}
        okText={edit.target ? '수정' : '추가'}
        cancelText="취소"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <div>
            <span className="form-label">태그명</span>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="예: 로맨스"
              maxLength={20}
              onPressEnter={submitEdit}
            />
          </div>
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
            <div>
              <AntTag color={colorDraft}>{nameDraft.trim() || '태그'}</AntTag>
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
