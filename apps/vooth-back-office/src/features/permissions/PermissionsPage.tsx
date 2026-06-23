import { useMemo, useState } from 'react';
import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PermissionCategory } from '@vooth/shared';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { FilterSelect } from '../../components/FilterSelect';
import {
  numberParam,
  stringArrayParam,
  stringParam,
  useUrlQuery,
} from '../../hooks/useUrlQuery';
import type { Permission } from '../../api/permission.api';
import { usePermissions } from './usePermissions';
import {
  PERMISSION_CATEGORY_COLOR,
  PERMISSION_CATEGORY_LABEL,
  PERMISSION_CATEGORY_OPTIONS,
} from '../accounts/labels';

export function PermissionsPage() {
  const [q, setQ] = useUrlQuery({
    q: stringParam(),
    cat: stringArrayParam<PermissionCategory>(),
    page: numberParam(1),
    limit: numberParam(DEFAULT_PAGE_SIZE),
  });
  const [searchInput, setSearchInput] = useState(q.q);

  const query = useMemo(
    () => ({
      searchKey: q.q ? 'name' : undefined,
      searchValue: q.q || undefined,
      categories: q.cat.length ? q.cat : undefined,
      page: q.page,
      limit: q.limit,
    }),
    [q.q, q.cat, q.page, q.limit],
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
        onSearch={(v) => setQ({ q: v, page: 1 })}
        placeholder="권한 이름 검색"
        filters={[
          {
            label: '카테고리',
            control: (
              <FilterSelect
                value={q.cat}
                options={PERMISSION_CATEGORY_OPTIONS}
                onChange={(v) => setQ({ cat: v, page: 1 })}
              />
            ),
          },
        ]}
      />

      <FullHeightTable<Permission>
        rowKey="code"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        pagination={{
          current: q.page,
          pageSize: q.limit,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== q.limit) {
              setQ({ limit: nextSize, page: 1 });
            } else {
              setQ({ page: nextPage });
            }
          },
        }}
      />
    </div>
  );
}
