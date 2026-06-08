import { Button, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  accountsMock,
  type Account,
  type AccountStatus,
  type AccountType,
} from '../mocks/accounts.mock';
import { findRole } from '../mocks/roles.mock';
import { DataTable, type SearchField } from '../components/DataTable';

const SEARCH_FIELDS = [
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
] satisfies SearchField<Account>[];

const TYPE_LABEL: Record<AccountType, string> = {
  ADMIN: '관리자',
  VOICE_ACTOR: '성우',
};

const TYPE_COLOR: Record<AccountType, string> = {
  ADMIN: 'geekblue',
  VOICE_ACTOR: 'purple',
};

const STATUS_META: Record<AccountStatus, { label: string; color: string }> = {
  pending: { label: '승인 대기', color: 'orange' },
  active: { label: '활성', color: 'green' },
  exited: { label: '퇴사', color: 'default' },
};

const columns: ColumnsType<Account> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  { title: '이름', dataIndex: 'name', key: 'name' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  {
    title: '유형',
    dataIndex: 'type',
    key: 'type',
    render: (type: AccountType) => (
      <Tag color={TYPE_COLOR[type]}>{TYPE_LABEL[type]}</Tag>
    ),
  },
  {
    title: '역할',
    dataIndex: 'roleId',
    key: 'roleId',
    render: (roleId: number | null) => {
      const role = findRole(roleId);
      return role ? (
        <Tag>{`${role.name} (${role.code})`}</Tag>
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
  { title: '생성일', dataIndex: 'createdAt', key: 'createdAt' },
];

export function AccountsPage() {
  return (
    <DataTable<Account>
      title="계정 관리"
      extra={<Button type="primary">계정 추가</Button>}
      data={accountsMock}
      columns={columns}
      searchFields={SEARCH_FIELDS}
    />
  );
}
