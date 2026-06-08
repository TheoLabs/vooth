import type { ReactNode } from 'react';
import { Flex, Input, Select, Space } from 'antd';

export interface SearchFieldOption<F extends string> {
  value: F;
  label: string;
}

interface TableToolbarProps<F extends string> {
  fields: SearchFieldOption<F>[];
  searchField: F;
  onSearchFieldChange: (field: F) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  right?: ReactNode;
}

export function TableToolbar<F extends string>({
  fields,
  searchField,
  onSearchFieldChange,
  keyword,
  onKeywordChange,
  right,
}: TableToolbarProps<F>) {
  return (
    <Flex
      align="center"
      justify="flex-start"
      gap={8}
      style={{ width: '100%', marginBottom: 8 }}
    >
      <Space.Compact>
        <Select<F>
          value={searchField}
          onChange={onSearchFieldChange}
          options={fields}
          style={{ width: 120 }}
        />
        <Input.Search
          allowClear
          placeholder="검색어를 입력하세요"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          style={{ width: 260 }}
        />
      </Space.Compact>
      {right}
    </Flex>
  );
}
