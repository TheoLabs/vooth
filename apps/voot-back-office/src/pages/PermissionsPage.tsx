import { useMemo, useState } from 'react';
import { App, Button, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PermissionCategory } from '@vooth/shared';
import {
  permissionsMock,
  PERMISSION_CATEGORY_META,
  PERMISSION_CATEGORY_OPTIONS,
  type Permission,
} from '../mocks/permissions.mock';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import {
  PermissionFormModal,
  type PermissionFormValues,
} from '../components/PermissionFormModal';
import '../components/DataTable.css';

type SearchField = 'code' | 'name';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'code', label: '코드' },
  { value: 'name', label: '이름' },
];

const columns: ColumnsType<Permission> = [
  {
    title: '코드',
    dataIndex: 'code',
    key: 'code',
    width: 200,
    render: (code: string) => <Tag color="cyan">{code}</Tag>,
  },
  { title: '이름', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: '카테고리',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    render: (category: PermissionCategory) => {
      const meta = PERMISSION_CATEGORY_META[category];
      return meta ? (
        <Tag color={meta.color}>{meta.label}</Tag>
      ) : (
        <Tag>{category}</Tag>
      );
    },
  },
  {
    title: '설명',
    dataIndex: 'description',
    key: 'description',
    render: (description: string) =>
      description ? (
        description
      ) : (
        <Typography.Text type="secondary">-</Typography.Text>
      ),
  },
];

export function PermissionsPage() {
  const { message } = App.useApp();

  const [permissions, setPermissions] = useState<Permission[]>(permissionsMock);
  const [searchField, setSearchField] = useState<SearchField>('code');
  const [keyword, setKeyword] = useState('');
  // 다중 카테고리 필터 (OR). 비어 있으면 전체.
  const [categoryFilter, setCategoryFilter] = useState<PermissionCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const categorySet = new Set(categoryFilter);
    return permissions.filter((perm) => {
      if (categorySet.size > 0 && !categorySet.has(perm.category)) return false;
      if (term && !perm[searchField].toLowerCase().includes(term)) return false;
      return true;
    });
  }, [permissions, categoryFilter, keyword, searchField]);

  const handleCreate = (values: PermissionFormValues) => {
    setPermissions((prev) => [values, ...prev]);
    setModalOpen(false);
    message.success(`'${values.name}' 권한을 등록했습니다.`);
  };

  return (
    <div className="bo-page">
      <Space
        align="center"
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          권한 관리
        </Typography.Title>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          권한 추가
        </Button>
      </Space>

      <TableToolbar<SearchField>
        fields={SEARCH_FIELDS}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        keyword={keyword}
        onKeywordChange={setKeyword}
      />

      <FilterBar>
        <FilterField label="카테고리">
          <Select<PermissionCategory[]>
            mode="multiple"
            allowClear
            showSearch
            placeholder="전체"
            style={{ minWidth: 260, maxWidth: 420 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={PERMISSION_CATEGORY_OPTIONS}
            optionFilterProp="label"
            maxTagCount="responsive"
          />
        </FilterField>
      </FilterBar>

      <FullHeightTable<Permission>
        className="data-table"
        rowKey="code"
        columns={columns}
        dataSource={filtered}
        pagination={{
          defaultPageSize: 30,
          pageSizeOptions: [30, 50, 100],
          showSizeChanger: true,
        }}
      />

      <PermissionFormModal
        open={modalOpen}
        existingCodes={permissions.map((perm) => perm.code)}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
