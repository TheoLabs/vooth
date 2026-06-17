import { Select, Space } from 'antd';

export interface FilterSelectOption<V> {
  value: V;
  label: string;
}

interface FilterSelectProps<V> {
  value: V[];
  options: FilterSelectOption<V>[];
  onChange: (value: V[]) => void;
  placeholder?: string;
  /** 고정 폭(관리자 계정 필터 기준 220 통일). 특수 케이스에서만 덮어쓴다. */
  width?: number;
  /** 주어지면 옵션 앞에 해당 색의 점을 표시한다(상태 필터 등). */
  dotColorOf?: (value: V) => string | undefined;
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
  width = 220,
  dotColorOf,
}: FilterSelectProps<V>) {
  return (
    <Select
      mode="multiple"
      allowClear
      placeholder={placeholder}
      style={{ width }}
      value={value}
      options={options}
      optionFilterProp="label"
      maxTagCount="responsive"
      onChange={(v) => onChange(v as V[])}
      optionRender={
        dotColorOf
          ? (option) => (
              <Space size={8}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: dotColorOf(option.value as V),
                    flex: 'none',
                  }}
                />
                {option.label}
              </Space>
            )
          : undefined
      }
    />
  );
}
