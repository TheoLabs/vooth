import { useMemo, useState } from 'react';
import { App, Button, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RoleType } from '@vooth/shared';
import { TableToolbar } from '../components/TableToolbar';
import {
  RoleFormModal,
  type RoleFormValues,
} from '../components/RoleFormModal';
import { rolesMock, ROLE_TYPE_META, ROLE_TYPE_OPTIONS } from '../mocks/roles.mock';
import {
  permissionsMock,
  permissionDescriptionByAction,
} from '../mocks/permissions.mock';
import '../components/DataTable.css';

// 이름으로 검색하고, 유형은 별도 드롭다운으로 필터링한다.
type SearchField = 'name';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

interface RoleRow {
  id: number;
  type: RoleType;
  name: string;
  description: string;
  permissions: string[];
}

// 목 역할 + 목 권한을 합쳐 초기 행 데이터를 만든다.
const seedRoles: RoleRow[] = rolesMock.map((role) => ({
  id: role.id,
  type: role.type,
  name: role.name,
  description: role.description,
  permissions: permissionsMock
    .filter((perm) => perm.roleId === role.id)
    .map((perm) => perm.action),
}));

const columns: ColumnsType<RoleRow> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  {
    title: '유형',
    dataIndex: 'type',
    key: 'type',
    width: 140,
    render: (type: RoleType) => {
      const meta = ROLE_TYPE_META[type];
      return <Tag color={meta.color}>{meta.label}</Tag>;
    },
  },
  { title: '이름', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: '설명',
    dataIndex: 'description',
    key: 'description',
    render: (description: string) =>
      description ? (
        description
      ) : (
        <Typography.Text type="secondary">-</Typography.Text>
      ),
  },
  {
    title: '권한 수',
    key: 'permissionCount',
    width: 96,
    align: 'center',
    render: (_, role) =>
      role.permissions.length > 0 ? (
        <Tag color="green">{role.permissions.length}</Tag>
      ) : (
        <Typography.Text type="secondary">0</Typography.Text>
      ),
  },
];

export function RolesPage() {
  const { message } = App.useApp();

  const [roles, setRoles] = useState<RoleRow[]>(seedRoles);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchField, setSearchField] = useState<SearchField>('name');
  // 입력 중인 검색어와 실제 적용된 검색어를 분리한다.
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    key: SearchField;
    value: string;
  } | null>(null);
  // 공유 패키지 RoleType 기반 유형 필터.
  const [typeFilter, setTypeFilter] = useState<RoleType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 클라이언트 측 필터링 (이름 검색 + 유형 필터, 목 데이터 기반)
  const filtered = useMemo(() => {
    return roles.filter((role) => {
      if (typeFilter && role.type !== typeFilter) return false;
      if (appliedSearch) {
        const term = appliedSearch.value.toLowerCase();
        if (!role[appliedSearch.key].toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [roles, appliedSearch, typeFilter]);

  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  const handleCreate = (values: RoleFormValues) => {
    setRoles((prev) => {
      const nextId =
        prev.reduce((max, role) => Math.max(max, role.id), 0) + 1;
      // 등록 폼에서 설명을 받지 않으므로 빈 값으로 둔다.
      return [{ id: nextId, description: '', ...values }, ...prev];
    });
    setModalOpen(false);
    setPage(DEFAULT_PAGE);
    message.success(`'${values.name}' 역할을 등록했습니다.`);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space
        align="center"
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          역할 관리
        </Typography.Title>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          역할 추가
        </Button>
      </Space>

      <TableToolbar<SearchField>
        fields={SEARCH_FIELDS}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        keyword={keywordInput}
        onKeywordChange={(value) => {
          setKeywordInput(value);
          // 입력을 비우면 검색을 해제한다.
          if (value.trim() === '' && appliedSearch) {
            setPage(DEFAULT_PAGE);
            setAppliedSearch(null);
          }
        }}
        onSearch={submitSearch}
        right={
          <Select<RoleType>
            allowClear
            placeholder="유형으로 필터"
            style={{ width: 200 }}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value ?? null);
              setPage(DEFAULT_PAGE);
            }}
            options={ROLE_TYPE_OPTIONS}
          />
        }
      />

      <Table<RoleRow>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        expandable={{
          // 행을 펼치면 부여된 권한을 태그로 보여준다.
          expandedRowRender: (role) =>
            role.permissions.length > 0 ? (
              <Space size={[8, 8]} wrap>
                {role.permissions.map((action) => (
                  <Tag key={action} color="cyan">
                    {permissionDescriptionByAction[action] ?? action}
                    <span style={{ marginInlineStart: 4, opacity: 0.6 }}>
                      {action}
                    </span>
                  </Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">
                부여된 권한이 없습니다.
              </Typography.Text>
            ),
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total: filtered.length,
          showSizeChanger: true,
          pageSizeOptions: [30, 50, 100],
        }}
        onChange={(pagination) => {
          const nextLimit = pagination.pageSize ?? DEFAULT_LIMIT;
          // 페이지 크기가 바뀌면 1페이지로 되돌린다.
          if (nextLimit !== limit) {
            setLimit(nextLimit);
            setPage(DEFAULT_PAGE);
          } else {
            setPage(pagination.current ?? DEFAULT_PAGE);
          }
        }}
      />

      <RoleFormModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </Space>
  );
}
