import { useMemo, useState } from 'react';
import {
  App as AntApp,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RoleType } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import { PermissionPicker } from './PermissionPicker';
import type { Role } from '../../api/role.api';
import { useCreateRole, useRoles, useUpdateRolePermissions } from './useRoles';
import { ROLE_TYPE_LABEL, ROLE_TYPE_OPTIONS } from '../accounts/labels';

/** 순서 무관 집합 동일 여부 */
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

export function RolesPage() {
  const { message } = AntApp.useApp();

  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<RoleType[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? 'name' : undefined,
      searchValue: searchValue || undefined,
      types: typeFilter.length ? typeFilter : undefined,
      page,
      limit: pageSize,
    }),
    [searchValue, typeFilter, page, pageSize],
  );

  const { data, isLoading } = useRoles(query);
  const createRole = useCreateRole();
  const updateRole = useUpdateRolePermissions();

  // 생성 모달
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<RoleType | undefined>();
  const [newCodes, setNewCodes] = useState<string[]>([]);

  const resetCreate = () => {
    setNewName('');
    setNewType(undefined);
    setNewCodes([]);
  };

  const submitCreate = () => {
    if (!newName.trim() || newType === undefined) {
      message.warning('이름과 타입을 입력하세요.');
      return;
    }
    createRole.mutate(
      { name: newName.trim(), type: newType, permissionCodes: newCodes },
      {
        onSuccess: () => {
          message.success('역할을 추가했습니다.');
          setCreateOpen(false);
          resetCreate();
        },
        onError: (e) => message.error(e.message),
      },
    );
  };

  // 수정(권한) 모달
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [editCodes, setEditCodes] = useState<string[]>([]);

  const openEdit = (role: Role) => {
    setEditTarget(role);
    setEditCodes(role.permissions.map((p) => p.code));
  };

  const submitEdit = () => {
    if (!editTarget) return;
    const original = editTarget.permissions.map((p) => p.code);
    if (sameSet(original, editCodes)) {
      message.info('변경된 내용이 없습니다.');
      return;
    }
    updateRole.mutate(
      { id: editTarget.id, permissionCodes: editCodes },
      {
        onSuccess: () => {
          message.success('권한을 수정했습니다.');
          setEditTarget(null);
        },
        onError: (e) => message.error(e.message),
      },
    );
  };

  const columns: ColumnsType<Role> = [
    { title: '이름', dataIndex: 'name', key: 'name' },
    {
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: RoleType) => <Tag color="geekblue">{ROLE_TYPE_LABEL[type]}</Tag>,
    },
    {
      title: '권한 수',
      key: 'permissionCount',
      width: 120,
      render: (_, role) => role.permissions.length,
    },
    {
      title: '액션',
      key: 'actions',
      width: 120,
      render: (_, role) => (
        <Button size="small" onClick={() => openEdit(role)}>
          수정
        </Button>
      ),
    },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={3} style={{ margin: 0 }}>
        역할
      </Typography.Title>

      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="역할명 검색"
        actions={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            역할 추가
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="타입">
          <Select
            mode="multiple"
            allowClear
            placeholder="전체"
            style={{ minWidth: 260 }}
            value={typeFilter}
            options={ROLE_TYPE_OPTIONS}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      <FullHeightTable<Role>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
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

      {/* 역할 추가 */}
      <Modal
        title="역할 추가"
        open={createOpen}
        maskClosable={false}
        width={640}
        onCancel={() => {
          setCreateOpen(false);
          resetCreate();
        }}
        onOk={submitCreate}
        okText="추가"
        cancelText="취소"
        confirmLoading={createRole.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text className="form-label">이름</Typography.Text>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="역할 이름"
            />
          </div>
          <div>
            <Typography.Text className="form-label">타입</Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="타입 선택"
              value={newType}
              options={ROLE_TYPE_OPTIONS}
              onChange={setNewType}
            />
          </div>
          <div>
            <Typography.Text className="form-label">권한</Typography.Text>
            <PermissionPicker value={newCodes} onChange={setNewCodes} />
          </div>
        </Space>
      </Modal>

      {/* 권한 수정 */}
      <Modal
        title={editTarget ? `권한 수정 — ${editTarget.name}` : '권한 수정'}
        open={editTarget !== null}
        maskClosable={false}
        width={640}
        onCancel={() => setEditTarget(null)}
        onOk={submitEdit}
        okText="저장"
        cancelText="취소"
        confirmLoading={updateRole.isPending}
      >
        <PermissionPicker value={editCodes} onChange={setEditCodes} />
      </Modal>
    </div>
  );
}
