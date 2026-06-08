import { useState } from 'react';
import { Alert, App, Button, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RoleType } from '@vooth/shared';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import {
  RoleFormModal,
  type RoleFormValues,
} from '../components/RoleFormModal';
import { useCreateRole, useRoles } from '../features/roles/useRoles';
import type { RoleListItem } from '../api/roles.api';
import { ROLE_TYPE_META, ROLE_TYPE_OPTIONS } from '../mocks/roles.mock';
import { ApiError } from '../lib/apiClient';
import '../components/DataTable.css';

// 이름은 텍스트 검색, 유형은 드롭다운으로 필터링한다.
// (백엔드는 단일 searchKey/searchValue 만 지원하므로 둘은 상호 배타적이다.)
type SearchField = 'name';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toISOString().slice(0, 10);
}

const columns: ColumnsType<RoleListItem> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  {
    title: '유형',
    dataIndex: 'type',
    key: 'type',
    width: 140,
    render: (type: RoleType) => {
      const meta = ROLE_TYPE_META[type];
      return meta ? (
        <Tag color={meta.color}>{meta.label}</Tag>
      ) : (
        <Tag>{type}</Tag>
      );
    },
  },
  { title: '이름', dataIndex: 'name', key: 'name' },
  {
    title: '생성일',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 140,
    render: (value?: string) => formatDate(value),
  },
];

export function RolesPage() {
  const { message } = App.useApp();

  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchField, setSearchField] = useState<SearchField>('name');
  // 입력 중인 검색어와 실제 적용된 검색어를 분리한다.
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    key: string;
    value: string;
  } | null>(null);
  // 공유 패키지 RoleType 기반 유형 필터.
  const [typeFilter, setTypeFilter] = useState<RoleType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isFetching, isError, error } = useRoles({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
  });

  const createRole = useCreateRole();

  // 이름 검색: 유형 필터와 상호 배타.
  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setTypeFilter(null);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  // 유형 필터: 이름 검색과 상호 배타.
  const handleTypeFilter = (value: RoleType | null) => {
    setPage(DEFAULT_PAGE);
    setTypeFilter(value);
    setKeywordInput('');
    setAppliedSearch(value ? { key: 'type', value } : null);
  };

  const handleCreate = (values: RoleFormValues) => {
    createRole.mutate(
      {
        type: values.type,
        name: values.name,
        permissionCodes: values.permissions,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setPage(DEFAULT_PAGE);
          message.success(`'${values.name}' 역할을 등록했습니다.`);
        },
        onError: (err) => {
          message.error(
            err instanceof ApiError
              ? err.message
              : '역할 등록에 실패했습니다.',
          );
        },
      },
    );
  };

  return (
    <div className="bo-page">
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
          // 입력을 비우면 이름 검색을 해제한다.
          if (value.trim() === '' && appliedSearch?.key === 'name') {
            setPage(DEFAULT_PAGE);
            setAppliedSearch(null);
          }
        }}
        onSearch={submitSearch}
      />

      <FilterBar>
        <FilterField label="유형">
          <Select<RoleType>
            allowClear
            placeholder="전체"
            style={{ width: 200 }}
            value={typeFilter}
            onChange={(value) => handleTypeFilter(value ?? null)}
            options={ROLE_TYPE_OPTIONS}
          />
        </FilterField>
      </FilterBar>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="역할 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      )}

      <FullHeightTable<RoleListItem>
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
        submitting={createRole.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
