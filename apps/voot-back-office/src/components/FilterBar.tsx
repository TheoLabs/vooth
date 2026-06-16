import type { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
}

/**
 * 검색창(TableToolbar) 하단의 필터 바.
 * 각 필터는 <FilterField label="..."> 로 감싸 label 을 컨트롤 상단에 둔다.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
      {children}
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        className="form-label"
        style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
