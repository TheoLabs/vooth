import type { ReactNode } from 'react';
import { Input, Select, Space } from 'antd';

export interface SearchKeyOption {
  value: string;
  label: string;
}

interface TableToolbarProps {
  /** 검색 기준(searchKey) 옵션. 1개 이상이면 select 노출 */
  searchKeys?: SearchKeyOption[];
  searchKey?: string;
  onSearchKeyChange?: (value: string) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  /** 엔터/검색 버튼 시 */
  onSearch: (value: string) => void;
  placeholder?: string;
  /** 우측 액션(예: 추가 버튼) */
  actions?: ReactNode;
}

/**
 * 목록 화면 상단 검색 영역.
 * 필터는 이 아래 별도 FilterBar 에 둔다(여기 같은 줄에 붙이지 않는다).
 */
export function TableToolbar({
  searchKeys,
  searchKey,
  onSearchKeyChange,
  searchValue,
  onSearchValueChange,
  onSearch,
  placeholder = '검색',
  actions,
}: TableToolbarProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <Space.Compact style={{ flex: 1, maxWidth: 480 }}>
        {searchKeys && searchKeys.length > 0 ? (
          <Select
            value={searchKey}
            onChange={onSearchKeyChange}
            options={searchKeys}
            style={{ width: 140 }}
          />
        ) : null}
        <Input.Search
          allowClear
          value={searchValue}
          placeholder={placeholder}
          onChange={(e) => onSearchValueChange(e.target.value)}
          onSearch={onSearch}
        />
      </Space.Compact>
      {actions ? <Space>{actions}</Space> : null}
    </div>
  );
}
