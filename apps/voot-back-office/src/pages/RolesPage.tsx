import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RoleType } from '@vooth/shared';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import {
  RoleFormModal,
  type RoleFormValues,
} from '../components/RoleFormModal';
import {
  useCreateRole,
  useRoles,
  useUpdateRole,
} from '../features/roles/useRoles';
import type { RoleListItem, RolePermission } from '../api/roles.api';
import { ROLE_TYPE_META, ROLE_TYPE_OPTIONS } from '../mocks/roles.mock';
import { ApiError } from '../lib/apiClient';
import '../components/DataTable.css';

// 이름은 텍스트 검색, 유형은 필터 바 다중 선택으로 필터링한다.
type SearchField = 'name';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'name', label: '이름' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

// 권한 컬럼에 노출할 최대 태그 수. 초과분은 "+N" 으로 요약한다.
const MAX_VISIBLE_PERMISSIONS = 3;

const baseColumns: ColumnsType<RoleListItem> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  { title: '이름', dataIndex: 'name', key: 'name' },
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
  {
    title: '권한 수',
    key: 'permissionCount',
    width: 96,
    render: (_, role) => <Tag>{role.permissions.length}</Tag>,
  },
  {
    title: '권한',
    key: 'permissions',
    render: (_, role) => {
      const { permissions } = role;
      if (permissions.length === 0) {
        return <Typography.Text type="secondary">-</Typography.Text>;
      }

      const visible = permissions.slice(0, MAX_VISIBLE_PERMISSIONS);
      const rest = permissions.slice(MAX_VISIBLE_PERMISSIONS);

      return (
        <Space size={4} wrap>
          {visible.map((permission: RolePermission) => (
            <Tag key={permission.code}>{permission.name}</Tag>
          ))}
          {rest.length > 0 && (
            <Tooltip title={rest.map((permission) => permission.name).join(', ')}>
              <Tag>{`+${rest.length}`}</Tag>
            </Tooltip>
          )}
        </Space>
      );
    },
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
  // 공유 패키지 RoleType 기반 유형 필터(다중 선택, types 파라미터로 전달).
  const [typeFilter, setTypeFilter] = useState<RoleType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  // 수정 대상 역할. null 이면 수정 모달이 닫힌 상태.
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);

  const { data, isFetching, isError, error } = useRoles({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
    types: typeFilter,
  });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  // 유형 필터: types 파라미터를 갱신하고 1페이지로 되돌린다.
  const handleTypeFilter = (value: RoleType[]) => {
    setPage(DEFAULT_PAGE);
    setTypeFilter(value);
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

  // 수정 모달을 닫으면서 대상 역할을 비운다.
  const closeEditModal = () => setEditingRole(null);

  const handleUpdate = (values: RoleFormValues) => {
    if (!editingRole) return;

    updateRole.mutate(
      {
        id: editingRole.id,
        // 수정 API 는 권한만 재할당한다(name/type 은 무시됨).
        payload: {
          permissionCodes: values.permissions,
        },
      },
      {
        onSuccess: () => {
          closeEditModal();
          message.success('역할이 수정되었습니다.');
        },
        onError: (err) => {
          message.error(
            err instanceof ApiError
              ? err.message
              : '역할 수정에 실패했습니다.',
          );
        },
      },
    );
  };

  // 기본 컬럼에 "관리"(수정) 액션 컬럼을 덧붙인다.
  const columns: ColumnsType<RoleListItem> = [
    ...baseColumns,
    {
      title: '관리',
      key: 'actions',
      width: 96,
      fixed: 'right',
      render: (_, role) => (
        <Button
          type="link"
          size="small"
          style={{ paddingInline: 0 }}
          onClick={() => setEditingRole(role)}
        >
          수정
        </Button>
      ),
    },
  ];

  // 선택된 역할로 수정 폼 초기값을 구성한다(권한은 코드 배열로 변환).
  const editInitialValues: RoleFormValues | undefined = editingRole
    ? {
        type: editingRole.type,
        name: editingRole.name,
        permissions: editingRole.permissions.map((permission) => permission.code),
      }
    : undefined;

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
          <Select<RoleType[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            style={{ minWidth: 200 }}
            value={typeFilter}
            onChange={(value) => handleTypeFilter(value ?? [])}
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

      <RoleFormModal
        open={editingRole !== null}
        mode="edit"
        initialValues={editInitialValues}
        submitting={updateRole.isPending}
        onCancel={closeEditModal}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
