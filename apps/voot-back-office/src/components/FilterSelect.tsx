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
  /** 박스 안 가장 왼쪽에 표시할 필터 라벨(어떤 키워드 필터인지). */
  label?: string;
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
  label,
  width = 220,
  dotColorOf,
}: FilterSelectProps<V>) {
  return (
    <Select
      mode="multiple"
      allowClear
      placeholder={placeholder}
      style={{ width }}
      prefix={
        label ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'rgba(0,0,0,0.45)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
            <span style={{ color: 'rgba(0,0,0,0.18)' }}>|</span>
          </span>
        ) : undefined
      }
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
