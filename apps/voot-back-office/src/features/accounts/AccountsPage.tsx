import { useMemo, useState } from 'react';
import {
  App as AntApp,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AccountStatus, AccountType } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import { useRoles } from '../roles/useRoles';
import type { Account } from '../../api/account.api';
import { AccountDetailDrawer } from './AccountDetailDrawer';
import {
  useAccounts,
  useApproveAccount,
} from './useAccounts';
import {
  ACCOUNT_STATUS_COLOR,
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_STATUS_OPTIONS,
  ACCOUNT_TYPE_COLOR,
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  ROLE_TYPE_LABEL,
} from './labels';

const SEARCH_KEYS = [
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
];

export function AccountsPage() {
  const { message } = AntApp.useApp();

  const [searchKey, setSearchKey] = useState('name');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [statuses, setStatuses] = useState<AccountStatus[]>([]);
  const [types, setTypes] = useState<AccountType[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? searchKey : undefined,
      searchValue: searchValue || undefined,
      statuses: statuses.length ? statuses : undefined,
      types: types.length ? types : undefined,
      page,
      limit: pageSize,
    }),
    [searchKey, searchValue, statuses, types, page, pageSize],
  );

  const { data, isLoading } = useAccounts(query);
  const approve = useApproveAccount();

  // 행 클릭 → 상세 Drawer
  const [detailId, setDetailId] = useState<number | null>(null);
  const detailAccount = useMemo(
    () => data?.items.find((a) => a.id === detailId) ?? null,
    [data, detailId],
  );

  // 승인(역할 선택) 모달 상태
  const [approveTarget, setApproveTarget] = useState<Account | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();
  const { data: rolesData } = useRoles({ page: 1, limit: 100 });

  const openApprove = (account: Account) => {
    setApproveTarget(account);
    setSelectedRoleId(undefined);
  };

  const submitApprove = () => {
    if (!approveTarget || selectedRoleId === undefined) return;
    approve.mutate(
      { id: approveTarget.id, roleId: selectedRoleId },
      {
        onSuccess: () => {
          message.success('계정을 승인했습니다.');
          setApproveTarget(null);
          setDetailId(null);
        },
        onError: (e) => message.error(e.message),
      },
    );
  };

  const columns: ColumnsType<Account> = [
    { title: '이름', dataIndex: 'name', key: 'name', width: 160 },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    {
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: AccountType) => (
        <Tag color={ACCOUNT_TYPE_COLOR[type]}>{ACCOUNT_TYPE_LABEL[type]}</Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AccountStatus) => (
        <Tag color={ACCOUNT_STATUS_COLOR[status]}>{ACCOUNT_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '역할',
      key: 'role',
      width: 160,
      render: (_, account) =>
        account.role ? (
          account.role.name
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={3} style={{ margin: 0 }}>
        관리자 계정
      </Typography.Title>

      <TableToolbar
        searchKeys={SEARCH_KEYS}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="이름 또는 이메일 검색"
      />

      <FilterBar>
        <FilterField label="상태">
          <Select
            mode="multiple"
            allowClear
            placeholder="전체"
            style={{ minWidth: 220 }}
            value={statuses}
            options={ACCOUNT_STATUS_OPTIONS}
            onChange={(v) => {
              setStatuses(v);
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label="타입">
          <Select
            mode="multiple"
            allowClear
            placeholder="전체"
            style={{ minWidth: 220 }}
            value={types}
            options={ACCOUNT_TYPE_OPTIONS}
            onChange={(v) => {
              setTypes(v);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      <FullHeightTable<Account>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        onRow={(account) => ({
          onClick: () => setDetailId(account.id),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== pageSize) {
              // 페이지 크기 변경 시 1페이지로 리셋
              setPageSize(nextSize);
              setPage(1);
            } else {
              setPage(nextPage);
            }
          },
        }}
      />

      <AccountDetailDrawer
        account={detailAccount}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        onApprove={openApprove}
      />

      <Modal
        title="계정 승인 (역할 부여)"
        open={approveTarget !== null}
        maskClosable={false}
        onCancel={() => setApproveTarget(null)}
        onOk={submitApprove}
        okText="승인"
        cancelText="취소"
        confirmLoading={approve.isPending}
        okButtonProps={{ disabled: selectedRoleId === undefined }}
      >
        {approveTarget ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text>
              <strong>{approveTarget.name}</strong> ({approveTarget.email}) 계정에 부여할 역할을
              선택하세요.
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="역할 선택"
              value={selectedRoleId}
              onChange={setSelectedRoleId}
              options={(rolesData?.items ?? []).map((role) => ({
                value: role.id,
                label: `${role.name} (${ROLE_TYPE_LABEL[role.type]})`,
              }))}
            />
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
