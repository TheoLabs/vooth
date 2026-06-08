import { useState } from 'react';
import { Alert, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TableToolbar } from '../components/TableToolbar';
import { useRoles } from '../features/roles/useRoles';
import type { RoleListItem } from '../api/roles.api';
import '../components/DataTable.css';

// API 는 실제 컬럼(name)만 검색 가능하므로 이름만 검색 필드로 제공한다.
type SearchField = 'name';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

const columns: ColumnsType<RoleListItem> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  // 백엔드가 아직 반환하지 않는 값. 목 자리 표시자로 유지한다.
  {
    title: '코드',
    key: 'code',
    render: () => <Tag color="default">-</Tag>,
  },
  { title: '이름', dataIndex: 'name', key: 'name' },
  // 백엔드가 아직 반환하지 않는 값. 목 자리 표시자로 유지한다.
  {
    title: '설명',
    key: 'description',
    render: () => <Typography.Text type="secondary">-</Typography.Text>,
  },
  // 백엔드가 아직 반환하지 않는 값. 목 자리 표시자로 유지한다.
  {
    title: '권한 수',
    key: 'permissionCount',
    width: 96,
    render: () => <Typography.Text type="secondary">-</Typography.Text>,
  },
];

export function RolesPage() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchField, setSearchField] = useState<SearchField>('name');
  // 입력 중인 검색어와 실제 조회에 반영된 검색어를 분리한다.
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    key: SearchField;
    value: string;
  } | null>(null);

  const { data, isFetching, isError, error } = useRoles({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
  });

  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Role 관리
      </Typography.Title>

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
      />

      {isError && (
        <Alert
          type="error"
          showIcon
          message="역할 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      )}

      <Table<RoleListItem>
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
    </Space>
  );
}
