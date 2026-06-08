import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { rolesMock, type Role } from '../mocks/roles.mock';
import { countPermissionsByRole } from '../mocks/permissions.mock';
import { DataTable, type SearchField } from '../components/DataTable';

const SEARCH_FIELDS = [
  { value: 'code', label: 'code' },
  { value: 'name', label: '이름' },
  { value: 'description', label: '설명' },
] satisfies SearchField<Role>[];

const columns: ColumnsType<Role> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
  {
    title: '코드',
    dataIndex: 'code',
    key: 'code',
    render: (code: string) => <Tag color="blue">{code}</Tag>,
  },
  { title: '이름', dataIndex: 'name', key: 'name' },
  { title: '설명', dataIndex: 'description', key: 'description' },
  {
    title: '권한 수',
    key: 'permissionCount',
    width: 96,
    render: (_, role) => countPermissionsByRole(role.id),
  },
];

export function RolesPage() {
  return (
    <DataTable<Role>
      title="Role 관리"
      data={rolesMock}
      columns={columns}
      searchFields={SEARCH_FIELDS}
    />
  );
}
