import type { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
}

/**
 * 검색창(TableToolbar) 하단의 필터 바(필터 4개 이상일 때).
 * 각 필터(FilterSelect)는 박스 안 prefix 로 라벨을 표시한다.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      {children}
    </div>
  );
}
