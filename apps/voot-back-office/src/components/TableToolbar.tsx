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
  /** 검색 제출(엔터/검색 버튼) 시 호출. 미지정 시 클라이언트 필터링 동작 유지. */
  onSearch?: (keyword: string) => void;
  right?: ReactNode;
}

export function TableToolbar<F extends string>({
  fields,
  searchField,
  onSearchFieldChange,
  keyword,
  onKeywordChange,
  onSearch,
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
          onSearch={onSearch}
          style={{ width: 260 }}
        />
      </Space.Compact>
      {right}
    </Flex>
  );
}
