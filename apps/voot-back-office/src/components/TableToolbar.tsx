import type { ReactNode } from 'react';
import { Input, Select, Space } from 'antd';
import { FilterBar, FilterField } from './FilterBar';

export interface SearchKeyOption {
  value: string;
  label: string;
}

/** 목록 필터 1개(라벨 + 컨트롤). */
export interface ToolbarFilter {
  label: string;
  control: ReactNode;
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
  /** 목록 필터. 3개 이하면 검색창 오른쪽에, 초과하면 검색창 아래에 배치한다. */
  filters?: ToolbarFilter[];
  /** 우측 액션(예: 추가 버튼) */
  actions?: ReactNode;
}

/** 필터를 검색창 오른쪽에 인라인 배치할 최대 개수(초과 시 아래 FilterBar). */
const INLINE_FILTER_MAX = 3;

/**
 * 목록 화면 상단 검색 영역.
 * - 필터 3개 이하: 검색창 바로 오른쪽에 인라인 배치.
 * - 필터 4개 이상: 검색창 아래 별도 FilterBar 에 배치.
 */
export function TableToolbar({
  searchKeys,
  searchKey,
  onSearchKeyChange,
  searchValue,
  onSearchValueChange,
  onSearch,
  placeholder = '검색',
  filters,
  actions,
}: TableToolbarProps) {
  const filterList = filters ?? [];
  const inline = filterList.length > 0 && filterList.length <= INLINE_FILTER_MAX;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Space.Compact
          style={{
            flex: inline ? '0 0 auto' : '1 1 auto',
            width: inline ? 320 : undefined,
            maxWidth: 480,
          }}
        >
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

        {inline
          ? filterList.map((f, i) => (
              <FilterField key={i} label={f.label}>
                {f.control}
              </FilterField>
            ))
          : null}

        {actions ? <div style={{ marginLeft: 'auto' }}>{actions}</div> : null}
      </div>

      {!inline && filterList.length > 0 ? (
        <FilterBar>
          {filterList.map((f, i) => (
            <FilterField key={i} label={f.label}>
              {f.control}
            </FilterField>
          ))}
        </FilterBar>
      ) : null}
    </>
  );
}
