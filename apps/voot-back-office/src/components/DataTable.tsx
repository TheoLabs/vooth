import { useMemo, useState, type ReactNode } from 'react';
import { Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import { TableToolbar } from './TableToolbar';
import './DataTable.css';

export interface SearchField<T> {
  label: string;
  value: string;
  getValue?: (row: T) => string;
}

interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnsType<T>;
  searchFields: SearchField<T>[];
  rowKey?: keyof T | ((row: T) => React.Key);
  defaultSearchField?: string;
  toolbarRight?: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  loading?: boolean;
  pagination?: TablePaginationConfig | false;
}

function resolveValue<T>(field: SearchField<T>, row: T): string {
  if (field.getValue) {
    return field.getValue(row);
  }
  const raw = (row as Record<string, unknown>)[field.value];
  return String(raw ?? '');
}

export function DataTable<T extends object>({
  data,
  columns,
  searchFields,
  rowKey = 'id' as keyof T,
  defaultSearchField,
  toolbarRight,
  title,
  extra,
  loading,
  pagination,
}: DataTableProps<T>) {
  const [searchField, setSearchField] = useState<string>(
    defaultSearchField ?? searchFields[0]?.value ?? '',
  );
  const [keyword, setKeyword] = useState('');

  const dataSource = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) {
      return data;
    }
    const field = searchFields.find((item) => item.value === searchField);
    if (!field) {
      return data;
    }
    return data.filter((row) =>
      resolveValue(field, row).toLowerCase().includes(term),
    );
  }, [data, searchFields, searchField, keyword]);

  const resolvedPagination =
    pagination === false
      ? false
      : {
          defaultPageSize: 30,
          pageSizeOptions: [30, 50, 100],
          showSizeChanger: true,
          ...pagination,
        };

  const toolbar = (
    <TableToolbar
      fields={searchFields.map(({ value, label }) => ({ value, label }))}
      searchField={searchField}
      onSearchFieldChange={setSearchField}
      keyword={keyword}
      onKeywordChange={setKeyword}
      right={toolbarRight}
    />
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {(title || extra) && (
        <Space
          align="center"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          {typeof title === 'string' ? (
            <Typography.Title level={3} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
          ) : (
            title
          )}
          {extra}
        </Space>
      )}
      {toolbar}
      <Table<T>
        className="data-table"
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={resolvedPagination}
      />
    </Space>
  );
}
