import { useState } from 'react';
import { Alert, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PermissionCategory } from '@vooth/shared';
import {
  PERMISSION_CATEGORY_META,
  PERMISSION_CATEGORY_OPTIONS,
} from '../mocks/permissions.mock';
import { TableToolbar } from '../components/TableToolbar';
import { FilterBar, FilterField } from '../components/FilterBar';
import { FullHeightTable } from '../components/FullHeightTable';
import { usePermissions } from '../features/permissions/usePermissions';
import type { PermissionItem } from '../api/permissions.api';
import '../components/DataTable.css';

type SearchField = 'code' | 'name' | 'description';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'code', label: '코드' },
  { value: 'name', label: '이름' },
  { value: 'description', label: '설명' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;

const columns: ColumnsType<PermissionItem> = [
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
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchField, setSearchField] = useState<SearchField>('code');
  // 입력 중인 검색어와 실제 조회에 반영된 검색어를 분리한다.
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    key: SearchField;
    value: string;
  } | null>(null);
  // 다중 카테고리 필터 (OR). 비어 있으면 전체.
  const [categories, setCategories] = useState<PermissionCategory[]>([]);

  const { data, isFetching, isError, error } = usePermissions({
    page,
    limit,
    searchKey: appliedSearch?.key,
    searchValue: appliedSearch?.value,
    categories,
  });

  const submitSearch = () => {
    const term = keywordInput.trim();
    setPage(DEFAULT_PAGE);
    setAppliedSearch(term ? { key: searchField, value: term } : null);
  };

  const handleCategoriesChange = (next: PermissionCategory[]) => {
    setPage(DEFAULT_PAGE);
    setCategories(next);
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
        <FilterField label="카테고리">
          <Select<PermissionCategory[]>
            mode="multiple"
            allowClear
            showSearch
            placeholder="전체"
            style={{ minWidth: 260, maxWidth: 420 }}
            value={categories}
            onChange={handleCategoriesChange}
            options={PERMISSION_CATEGORY_OPTIONS}
            optionFilterProp="label"
            maxTagCount="responsive"
          />
        </FilterField>
      </FilterBar>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="권한 목록을 불러오지 못했습니다."
          description={error?.message}
        />
      )}

      <FullHeightTable<PermissionItem>
        className="data-table"
        rowKey="code"
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
    </div>
  );
}
