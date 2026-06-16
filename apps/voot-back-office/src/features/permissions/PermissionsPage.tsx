import { useMemo, useState } from 'react';
import { Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PermissionCategory } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterBar, FilterField } from '../../components/FilterBar';
import type { Permission } from '../../api/permission.api';
import { usePermissions } from './usePermissions';
import {
  PERMISSION_CATEGORY_COLOR,
  PERMISSION_CATEGORY_LABEL,
  PERMISSION_CATEGORY_OPTIONS,
} from '../accounts/labels';

export function PermissionsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? 'name' : undefined,
      searchValue: searchValue || undefined,
      categories: categories.length ? categories : undefined,
      page,
      limit: pageSize,
    }),
    [searchValue, categories, page, pageSize],
  );

  const { data, isLoading } = usePermissions(query);

  const columns: ColumnsType<Permission> = [
    {
      title: '코드',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (code: string) => (
        <Typography.Text code copyable={{ text: code }} style={{ fontSize: 13 }}>
          {code}
        </Typography.Text>
      ),
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: PermissionCategory) => (
        <Tag color={PERMISSION_CATEGORY_COLOR[category]}>
          {PERMISSION_CATEGORY_LABEL[category]}
        </Tag>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Typography.Text type="secondary">{description}</Typography.Text>
      ),
    },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={3} style={{ margin: 0 }}>
        권한
      </Typography.Title>

      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="권한 이름 검색"
      />

      <FilterBar>
        <FilterField label="카테고리">
          <Select
            mode="multiple"
            allowClear
            placeholder="전체"
            style={{ minWidth: 260 }}
            value={categories}
            options={PERMISSION_CATEGORY_OPTIONS}
            onChange={(v) => {
              setCategories(v);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      <FullHeightTable<Permission>
        rowKey="code"
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
    </div>
  );
}
