import { useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PermissionCategory, RoleType } from '@vooth/shared';
import { PERMISSION_CATEGORY_META } from '../mocks/permissions.mock';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import {
  RoleFormModal,
  type RoleFormValues,
} from '../components/RoleFormModal';
import { useCreateRole, useRoles, useUpdateRole } from '../features/roles/useRoles';
import { usePermissions } from '../features/permissions/usePermissions';
import type { RoleListItem, RolePermission } from '../api/roles.api';
import type { PermissionItem } from '../api/permissions.api';
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

// 카테고리 코드(문자열)에 대한 표시 메타. 알 수 없는 코드는 코드 자체를 라벨로 사용한다.
function categoryMeta(category: string): { label: string; color?: string } {
  const meta = PERMISSION_CATEGORY_META[category as PermissionCategory];
  return meta ?? { label: category };
}

// 카테고리(category) 필드를 가진 항목을 카테고리별로 묶는다(원본 순서 유지).
function groupByCategory<T extends { category: string }>(
  items: T[],
): { category: string; items: T[] }[] {
  const groups: { category: string; items: T[] }[] = [];
  const indexByCategory = new Map<string, number>();

  for (const item of items) {
    const existing = indexByCategory.get(item.category);
    if (existing === undefined) {
      indexByCategory.set(item.category, groups.length);
      groups.push({ category: item.category, items: [item] });
    } else {
      groups[existing].items.push(item);
    }
  }

  return groups;
}

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
  // 상세 Drawer 대상 역할. null 이면 닫힌 상태.
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null);
  // Drawer 권한 섹션 편집 모드 여부. true 이면 체크박스 편집기를 노출한다.
  const [isEditing, setIsEditing] = useState(false);
  // 편집 모드에서 체크된 권한 코드 집합.
  const [checkedCodes, setCheckedCodes] = useState<string[]>([]);

  const { data, isFetching, isError, error } = useRoles({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
    types: typeFilter,
  });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  // 편집 모드에서만 전체 권한 카탈로그를 조회한다(약 27개, 넉넉히 limit 100).
  const {
    data: catalogData,
    isFetching: isCatalogFetching,
    isError: isCatalogError,
  } = usePermissions(
    { page: 1, limit: 100 },
    { enabled: isEditing },
  );

  const catalogItems = useMemo(
    () => catalogData?.items ?? [],
    [catalogData],
  );
  const catalogGroups = useMemo(
    () => groupByCategory(catalogItems),
    [catalogItems],
  );

  // Drawer 를 닫거나 다른 역할을 선택하면 편집 상태를 초기화한다.
  const closeDrawer = () => {
    setSelectedRole(null);
    setIsEditing(false);
    setCheckedCodes([]);
  };

  // 보기 → 편집 전환: 현재 역할의 권한 코드로 체크 상태를 초기화한다.
  const startEditing = () => {
    if (!selectedRole) return;
    setCheckedCodes(selectedRole.permissions.map((permission) => permission.code));
    setIsEditing(true);
  };

  // 편집 취소: 변경 사항을 버리고 보기 모드로 돌아간다.
  const cancelEditing = () => {
    setIsEditing(false);
    setCheckedCodes([]);
  };

  const toggleCode = (code: string, checked: boolean) => {
    setCheckedCodes((prev) =>
      checked ? [...prev, code] : prev.filter((value) => value !== code),
    );
  };

  // 카테고리 단위 전체 선택/해제.
  const toggleCategory = (codes: string[], checked: boolean) => {
    setCheckedCodes((prev) => {
      if (checked) {
        const next = new Set(prev);
        codes.forEach((code) => next.add(code));
        return [...next];
      }
      const removeSet = new Set(codes);
      return prev.filter((value) => !removeSet.has(value));
    });
  };

  // 저장: 체크된 권한 코드로 PUT 한 뒤 Drawer 의 표시 역할을 즉시 갱신한다.
  const handleSavePermissions = () => {
    if (!selectedRole) return;

    updateRole.mutate(
      {
        id: selectedRole.id,
        payload: { permissionCodes: checkedCodes },
      },
      {
        onSuccess: () => {
          // 카탈로그에서 체크된 코드에 해당하는 권한 객체를 추려 보기 모드 목록을 갱신한다.
          const checkedSet = new Set(checkedCodes);
          const nextPermissions: RolePermission[] = catalogItems
            .filter((item) => checkedSet.has(item.code))
            .map((item) => ({
              code: item.code,
              name: item.name,
              category: item.category,
              description: item.description,
            }));
          setSelectedRole({ ...selectedRole, permissions: nextPermissions });
          setIsEditing(false);
          setCheckedCodes([]);
          message.success('역할 권한이 수정되었습니다.');
        },
        onError: (err) => {
          message.error(
            err instanceof ApiError ? err.message : '역할 권한 수정에 실패했습니다.',
          );
        },
      },
    );
  };

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

  // 보기 모드: 역할에 할당된 권한을 카테고리별 읽기 전용 목록으로 렌더링한다.
  const renderPermissionView = (permissions: RolePermission[]) => {
    if (permissions.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary">
              할당된 권한이 없습니다.
            </Typography.Text>
          }
        />
      );
    }

    return groupByCategory(permissions).map((group, index) => {
      const meta = categoryMeta(group.category);
      return (
        <div key={group.category}>
          {index > 0 && <Divider style={{ margin: '12px 0' }} />}
          <div style={{ marginTop: index === 0 ? 8 : 0 }}>
            <Tag color={meta.color}>{meta.label}</Tag>
          </div>
          <Space
            direction="vertical"
            size={4}
            style={{ width: '100%', marginTop: 8 }}
          >
            {group.items.map((permission) => (
              <div key={permission.code}>
                <Typography.Text>{permission.name}</Typography.Text>{' '}
                <Typography.Text type="secondary" code>
                  {permission.code}
                </Typography.Text>
              </div>
            ))}
          </Space>
        </div>
      );
    });
  };

  // 편집 모드: 전체 권한 카탈로그를 카테고리별 체크박스로 렌더링한다.
  const renderPermissionEditor = () => {
    if (isCatalogError) {
      return (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 8 }}
          message="권한 목록을 불러오지 못했습니다."
        />
      );
    }

    if (isCatalogFetching && catalogItems.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin />
        </div>
      );
    }

    const checkedSet = new Set(checkedCodes);

    return catalogGroups.map((group, index) => {
      const meta = categoryMeta(group.category);
      const codes = group.items.map((item) => item.code);
      const allChecked = codes.every((code) => checkedSet.has(code));
      const someChecked = codes.some((code) => checkedSet.has(code));

      return (
        <div key={group.category}>
          {index > 0 && <Divider style={{ margin: '12px 0' }} />}
          <div
            style={{
              marginTop: index === 0 ? 8 : 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Checkbox
              checked={allChecked}
              indeterminate={!allChecked && someChecked}
              onChange={(e) => toggleCategory(codes, e.target.checked)}
            />
            <Tag color={meta.color}>{meta.label}</Tag>
          </div>
          <Space
            direction="vertical"
            size={4}
            style={{ width: '100%', marginTop: 8 }}
          >
            {group.items.map((item: PermissionItem) => (
              <Checkbox
                key={item.code}
                checked={checkedSet.has(item.code)}
                onChange={(e) => toggleCode(item.code, e.target.checked)}
              >
                <Typography.Text>{item.name}</Typography.Text>{' '}
                <Typography.Text type="secondary" code>
                  {item.code}
                </Typography.Text>
              </Checkbox>
            ))}
          </Space>
        </div>
      );
    });
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
          <Select<RoleType[]>
            mode="multiple"
            allowClear
            placeholder="전체"
            value={typeFilter}
            onChange={(value) => handleTypeFilter(value ?? [])}
            options={ROLE_TYPE_OPTIONS}
            maxTagCount="responsive"
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
        columns={baseColumns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        onRow={(record) => ({
          onClick: () => setSelectedRole(record),
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
        title="역할 상세"
        placement="right"
        width={480}
        open={selectedRole !== null}
        onClose={closeDrawer}
        destroyOnClose
        maskClosable={false}
        extra={
          selectedRole &&
          (isEditing ? (
            <Space>
              <Button onClick={cancelEditing} disabled={updateRole.isPending}>
                취소
              </Button>
              <Button
                type="primary"
                loading={updateRole.isPending}
                disabled={isCatalogFetching}
                onClick={handleSavePermissions}
              >
                저장
              </Button>
            </Space>
          ) : (
            <Button type="primary" onClick={startEditing}>
              수정
            </Button>
          ))
        }
      >
        {selectedRole && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{selectedRole.id}</Descriptions.Item>
              <Descriptions.Item label="이름">
                {selectedRole.name}
              </Descriptions.Item>
              <Descriptions.Item label="유형">
                {ROLE_TYPE_META[selectedRole.type] ? (
                  <Tag color={ROLE_TYPE_META[selectedRole.type].color}>
                    {ROLE_TYPE_META[selectedRole.type].label}
                  </Tag>
                ) : (
                  <Tag>{selectedRole.type}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="권한 수">
                <Tag>{selectedRole.permissions.length}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Text strong>권한 목록</Typography.Text>
              {isEditing
                ? renderPermissionEditor()
                : renderPermissionView(selectedRole.permissions)}
            </div>
          </Space>
        )}
      </Drawer>

      <RoleFormModal
        open={modalOpen}
        submitting={createRole.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
