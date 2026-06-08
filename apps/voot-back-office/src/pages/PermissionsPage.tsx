import { useMemo, useState } from 'react';
import { Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { permissionsMock, type Permission } from '../mocks/permissions.mock';
import { findRole, rolesMock, ROLE_TYPE_META } from '../mocks/roles.mock';
import { DataTable, type SearchField } from '../components/DataTable';

const SEARCH_FIELDS = [
  { value: 'action', label: 'action' },
  { value: 'description', label: '설명' },
] satisfies SearchField<Permission>[];

const columns: ColumnsType<Permission> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  {
    title: '액션',
    dataIndex: 'action',
    key: 'action',
    render: (action: string) => <Tag color="cyan">{action}</Tag>,
  },
  { title: '설명', dataIndex: 'description', key: 'description' },
  {
    title: '역할',
    dataIndex: 'roleId',
    key: 'roleId',
    render: (roleId: number) => {
      const role = findRole(roleId);
      return role ? role.name : '-';
    },
  },
];

export function PermissionsPage() {
  const [roleFilter, setRoleFilter] = useState<number | null>(null);

  const data = useMemo(
    () =>
      roleFilter === null
        ? permissionsMock
        : permissionsMock.filter(
            (permission) => permission.roleId === roleFilter,
          ),
    [roleFilter],
  );

  return (
    <DataTable<Permission>
      title="Permission 관리"
      data={data}
      columns={columns}
      searchFields={SEARCH_FIELDS}
      toolbarRight={
        <Select<number | null>
          allowClear
          placeholder="역할로 필터"
          style={{ width: 220 }}
          value={roleFilter}
          onChange={(value) => setRoleFilter(value ?? null)}
          options={rolesMock.map((role) => ({
            value: role.id,
            label: `${role.name} (${ROLE_TYPE_META[role.type].label})`,
          }))}
        />
      }
    />
  );
}
