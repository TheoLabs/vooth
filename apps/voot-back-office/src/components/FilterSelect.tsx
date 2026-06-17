import { Select } from 'antd';

export interface FilterSelectOption<V> {
  value: V;
  label: string;
}

interface FilterSelectProps<V> {
  value: V[];
  options: FilterSelectOption<V>[];
  onChange: (value: V[]) => void;
  placeholder?: string;
  /** 폭(관리자 계정 필터 기준 220 통일). 특수 케이스에서만 덮어쓴다. */
  minWidth?: number;
}

/**
 * 목록 다중 선택(드롭다운) 필터 공용 컴포넌트.
 * 모든 목록 화면의 드롭다운 필터는 이 컴포넌트를 쓴다(폭·플레이스홀더 일관).
 */
export function FilterSelect<V extends string | number>({
  value,
  options,
  onChange,
  placeholder = '전체',
  minWidth = 220,
}: FilterSelectProps<V>) {
  return (
    <Select
      mode="multiple"
      allowClear
      placeholder={placeholder}
      style={{ minWidth }}
      value={value}
      options={options}
      onChange={(v) => onChange(v as V[])}
    />
  );
}
