import { useState } from 'react';
import { Alert, Button, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AccountType } from '@vooth/shared';
import { findRole, ROLE_TYPE_META } from '../mocks/roles.mock';
import { TableToolbar } from '../components/TableToolbar';
import { useAccounts } from '../features/accounts/useAccounts';
import type { AccountListItem, AccountStatus } from '../api/accounts.api';
import '../components/DataTable.css';

type SearchField = 'name' | 'email';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
];

const STATUS_META: Record<AccountStatus, { label: string; color: string }> = {
  pending: { label: '승인 대기', color: 'orange' },
  active: { label: '활성', color: 'green' },
  exited: { label: '퇴사', color: 'default' },
};

const TYPE_META: Record<AccountType, { label: string; color: string }> = {
  [AccountType.ADMIN]: { label: '관리자', color: 'geekblue' },
  [AccountType.CREATOR]: { label: '크리에이터', color: 'green' },
};

const DEFAULT_TYPE_META = { label: '알 수 없음', color: 'default' };

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toISOString().slice(0, 10);
}

const columns: ColumnsType<AccountListItem> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  { title: '이름', dataIndex: 'name', key: 'name' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  {
    title: '유형',
    dataIndex: 'type',
    key: 'type',
    render: (type: AccountType) => {
      const meta = TYPE_META[type] ?? DEFAULT_TYPE_META;
      return <Tag color={meta.color}>{meta.label}</Tag>;
    },
  },
  {
    title: '역할',
    dataIndex: 'roleId',
    key: 'roleId',
    render: (roleId: number | null) => {
      const role = findRole(roleId);
      return role ? (
        <Tag>{`${role.name} (${ROLE_TYPE_META[role.type].label})`}</Tag>
      ) : (
        <Typography.Text type="secondary">미지정</Typography.Text>
      );
    },
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    render: (status: AccountStatus) => {
      const meta = STATUS_META[status];
      return <Tag color={meta.color}>{meta.label}</Tag>;
    },
  },
  {
    title: '생성일',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => formatDate(value),
  },
];

export function AccountsPage() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchField, setSearchField] = useState<SearchField>('name');
  // 입력 중인 검색어와 실제 조회에 반영된 검색어를 분리한다.
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    key: SearchField;
    value: string;
  } | null>(null);

  const { data, isFetching, isError, error } = useAccounts({
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
      <Space
        align="center"
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          계정 관리
        </Typography.Title>
        <Button type="primary">계정 추가</Button>
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
      />

      {isError && (
        <Alert
          type="error"
          showIcon
          message="계정 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      )}

      <Table<AccountListItem>
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
