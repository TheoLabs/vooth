import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AccountStatus as AccountStatusEnum, AccountType } from '@vooth/shared';
import { ROLE_TYPE_META } from '../mocks/roles.mock';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import { useAccounts } from '../features/accounts/useAccounts';
import { useApproveAccount } from '../features/accounts/useApproveAccount';
import { useRejectAccount } from '../features/accounts/useRejectAccount';
import { useExitAccount } from '../features/accounts/useExitAccount';
import { useRoles } from '../features/roles/useRoles';
import { useMe } from '../features/auth/useMe';
import type { AccountListItem, AccountStatus } from '../api/accounts.api';
import type { RoleListItem } from '../api/roles.api';
import '../components/DataTable.css';

type SearchField = 'name' | 'email';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
];

const STATUS_META: Record<AccountStatus, { label: string; color: string }> = {
  pending: { label: '승인 대기', color: 'orange' },
  rejected: { label: '거절', color: 'volcano' },
  active: { label: '활성', color: 'green' },
  exited: { label: '퇴사', color: 'default' },
};

const TYPE_META: Record<AccountType, { label: string; color: string }> = {
  [AccountType.ADMIN]: { label: '관리자', color: 'geekblue' },
  [AccountType.CREATOR]: { label: '크리에이터', color: 'green' },
};

const DEFAULT_TYPE_META = { label: '알 수 없음', color: 'default' };

/** 상태 필터 옵션: 공유 enum 값 + 상태 메타 라벨. */
const STATUS_FILTER_OPTIONS = Object.values(AccountStatusEnum).map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

/** 유형 필터 옵션: 공유 enum 값 + 유형 메타 라벨. */
const TYPE_FILTER_OPTIONS = Object.values(AccountType).map((type) => ({
  value: type,
  label: TYPE_META[type].label,
}));

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

/** 역할 피커가 모든 역할을 한 번에 받을 수 있도록 넉넉한 limit 으로 조회한다. */
const ROLE_PICKER_LIMIT = 100;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toISOString().slice(0, 10);
}

/** 역할 라벨: "역할명 (유형)" */
function roleLabel(role: RoleListItem): string {
  return `${role.name} (${ROLE_TYPE_META[role.type].label})`;
}

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
  // 상태/유형 다중 선택 필터(공유 enum 기반, statuses/types 파라미터로 전달).
  const [statusFilter, setStatusFilter] = useState<AccountStatusEnum[]>([]);
  const [typeFilter, setTypeFilter] = useState<AccountType[]>([]);

  // 상세 Drawer 상태.
  const [selectedAccount, setSelectedAccount] =
    useState<AccountListItem | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(
    undefined,
  );

  const { data, isFetching, isError, error } = useAccounts({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
    statuses: statusFilter,
    types: typeFilter,
  });

  // 역할 목록: roleId → 역할명 매핑과 승인 피커 옵션에 모두 사용한다.
  const { data: rolesData } = useRoles({
    page: DEFAULT_PAGE,
    limit: ROLE_PICKER_LIMIT,
  });
  const roles = useMemo(() => rolesData?.items ?? [], [rolesData]);
  const roleById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles],
  );

  // 본인 계정은 스스로 퇴사 처리할 수 없으므로 /me 로 본인 식별자를 가져온다.
  const { data: me } = useMe();

  const approveMutation = useApproveAccount();
  const rejectMutation = useRejectAccount();
  const exitMutation = useExitAccount();

  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  // 상태 필터: statuses 파라미터를 갱신하고 1페이지로 되돌린다.
  const handleStatusFilter = (value: AccountStatusEnum[]) => {
    setPage(DEFAULT_PAGE);
    setStatusFilter(value);
  };

  // 유형 필터: types 파라미터를 갱신하고 1페이지로 되돌린다.
  const handleTypeFilter = (value: AccountType[]) => {
    setPage(DEFAULT_PAGE);
    setTypeFilter(value);
  };

  const openDrawer = (account: AccountListItem) => {
    setSelectedAccount(account);
    setSelectedRoleId(account.roleId ?? undefined);
  };

  const closeDrawer = () => {
    setSelectedAccount(null);
    setSelectedRoleId(undefined);
  };

  const handleApprove = () => {
    if (!selectedAccount || selectedRoleId === undefined) return;
    approveMutation.mutate(
      { id: selectedAccount.id, payload: { roleId: selectedRoleId } },
      {
        onSuccess: () => {
          message.success('계정이 승인되었습니다.');
          closeDrawer();
        },
        onError: (err) => {
          message.error(err.message);
        },
      },
    );
  };

  const handleReassignRole = () => {
    if (!selectedAccount || selectedRoleId === undefined) return;
    const targetRoleId = selectedRoleId;
    approveMutation.mutate(
      { id: selectedAccount.id, payload: { roleId: targetRoleId } },
      {
        onSuccess: () => {
          message.success('역할이 변경되었습니다.');
          // 목록 무효화와 별개로 열려 있는 Drawer 에도 변경된 역할을 반영한다.
          setSelectedAccount((prev) =>
            prev ? { ...prev, roleId: targetRoleId } : prev,
          );
        },
        onError: (err) => {
          message.error(err.message);
        },
      },
    );
  };

  const handleReject = () => {
    if (!selectedAccount) return;
    rejectMutation.mutate(selectedAccount.id, {
      onSuccess: () => {
        message.success('계정을 거절했습니다.');
        closeDrawer();
      },
      onError: (err) => {
        message.error(err.message);
      },
    });
  };

  const handleExit = () => {
    if (!selectedAccount) return;
    exitMutation.mutate(selectedAccount.id, {
      onSuccess: () => {
        message.success('퇴사 처리되었습니다.');
        closeDrawer();
      },
      onError: (err) => {
        message.error(err.message);
      },
    });
  };

  const renderRoleTag = (roleId: number | null) => {
    const role = roleId == null ? undefined : roleById.get(roleId);
    return role ? (
      <Tag>{roleLabel(role)}</Tag>
    ) : (
      <Typography.Text type="secondary">미지정</Typography.Text>
    );
  };

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
      render: (roleId: number | null) => renderRoleTag(roleId),
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

  // Drawer 액션은 실제 상태(status)로 분기한다.
  // PENDING → 승인/거절, ACTIVE → 퇴사 처리, REJECTED/EXITED → 액션 없음.
  const pendingDrawer =
    selectedAccount?.status === AccountStatusEnum.PENDING;
  const activeDrawer = selectedAccount?.status === AccountStatusEnum.ACTIVE;
  // 본인 계정 여부: 본인은 퇴사 처리 버튼을 노출하지 않는다.
  const isSelf = me?.id === selectedAccount?.id;

  return (
    <div className="bo-page">
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

      <FilterBar>
        <FilterField label="상태">
          <Select<AccountStatusEnum[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            value={statusFilter}
            onChange={(value) => handleStatusFilter(value ?? [])}
            options={STATUS_FILTER_OPTIONS}
            maxTagCount="responsive"
          />
        </FilterField>
        <FilterField label="유형">
          <Select<AccountType[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            value={typeFilter}
            onChange={(value) => handleTypeFilter(value ?? [])}
            options={TYPE_FILTER_OPTIONS}
            maxTagCount="responsive"
          />
        </FilterField>
      </FilterBar>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="계정 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      )}

      <FullHeightTable<AccountListItem>
        className="data-table"
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        onRow={(record) => ({
          onClick: () => openDrawer(record),
          style: { cursor: 'pointer' },
        })}
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

      <Drawer
        title="계정 상세"
        placement="right"
        width={420}
        open={selectedAccount !== null}
        onClose={closeDrawer}
        destroyOnClose
      >
        {selectedAccount && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="이름">
                {selectedAccount.name}
              </Descriptions.Item>
              <Descriptions.Item label="이메일">
                {selectedAccount.email}
              </Descriptions.Item>
              <Descriptions.Item label="유형">
                <Tag
                  color={
                    (TYPE_META[selectedAccount.type] ?? DEFAULT_TYPE_META).color
                  }
                >
                  {(TYPE_META[selectedAccount.type] ?? DEFAULT_TYPE_META).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={STATUS_META[selectedAccount.status].color}>
                  {STATUS_META[selectedAccount.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="역할">
                {renderRoleTag(selectedAccount.roleId)}
              </Descriptions.Item>
              <Descriptions.Item label="ID">
                {selectedAccount.id}
              </Descriptions.Item>
              <Descriptions.Item label="가입일">
                {formatDate(selectedAccount.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            {pendingDrawer && (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Typography.Text strong>승인</Typography.Text>
                <Typography.Text type="secondary">
                  부여할 역할을 선택한 뒤 승인하세요.
                </Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="역할 선택"
                  value={selectedRoleId}
                  onChange={setSelectedRoleId}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: roleLabel(role),
                  }))}
                />
                <Button
                  type="primary"
                  block
                  disabled={selectedRoleId === undefined}
                  loading={approveMutation.isPending}
                  onClick={handleApprove}
                >
                  승인
                </Button>
                <Popconfirm
                  title="이 계정을 거절하시겠어요?"
                  okText="거절"
                  cancelText="취소"
                  okButtonProps={{ loading: rejectMutation.isPending }}
                  onConfirm={handleReject}
                >
                  <Button block loading={rejectMutation.isPending}>
                    거절
                  </Button>
                </Popconfirm>
              </Space>
            )}

            {activeDrawer && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <Typography.Text strong>역할 변경</Typography.Text>
                  <Typography.Text type="secondary">
                    변경할 역할을 선택한 뒤 역할 변경을 적용하세요.
                  </Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="역할 선택"
                    value={selectedRoleId}
                    onChange={setSelectedRoleId}
                    options={roles.map((role) => ({
                      value: role.id,
                      label: roleLabel(role),
                    }))}
                  />
                  <Button
                    type="primary"
                    block
                    disabled={
                      selectedRoleId === undefined ||
                      selectedRoleId === selectedAccount.roleId
                    }
                    loading={approveMutation.isPending}
                    onClick={handleReassignRole}
                  >
                    역할 변경
                  </Button>
                </Space>

                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <Typography.Text strong>퇴사 처리</Typography.Text>
                  <Typography.Text type="secondary">
                    퇴사 처리하면 계정의 역할이 해제됩니다.
                  </Typography.Text>
                  {isSelf ? (
                    <Typography.Text type="secondary">
                      본인 계정은 퇴사 처리할 수 없습니다.
                    </Typography.Text>
                  ) : (
                    <Popconfirm
                      title="이 계정을 퇴사 처리하시겠어요?"
                      okText="퇴사 처리"
                      cancelText="취소"
                      okButtonProps={{
                        danger: true,
                        loading: exitMutation.isPending,
                      }}
                      onConfirm={handleExit}
                    >
                      <Button danger block loading={exitMutation.isPending}>
                        퇴사 처리
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Space>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
