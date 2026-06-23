import { useMemo } from 'react';
import { Checkbox, Collapse, Empty, Spin, Typography } from 'antd';
import type { PermissionCategory } from '@vooth/shared';
import { useAllPermissions } from '../permissions/usePermissions';
import { PERMISSION_CATEGORY_LABEL } from '../accounts/labels';
import type { Permission } from '../../api/permission.api';

interface PermissionPickerProps {
  /** 선택된 권한 code 집합 */
  value: string[];
  onChange: (codes: string[]) => void;
}

/**
 * 권한 다중 선택 UI. GET /admins/permissions 목록을 카테고리별 그룹 체크박스로 표시한다.
 * 각 그룹 헤더의 체크박스로 그룹 전체 선택/해제가 가능하다.
 */
export function PermissionPicker({ value, onChange }: PermissionPickerProps) {
  const { data, isLoading } = useAllPermissions();
  const selected = useMemo(() => new Set(value), [value]);

  const grouped = useMemo(() => {
    const map = new Map<PermissionCategory, Permission[]>();
    for (const p of data?.items ?? []) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return [...map.entries()];
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (grouped.length === 0) {
    return <Empty description="권한이 없습니다." />;
  }

  const toggle = (code: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(code);
    else next.delete(code);
    onChange([...next]);
  };

  const toggleGroup = (codes: string[], checked: boolean) => {
    const next = new Set(selected);
    for (const code of codes) {
      if (checked) next.add(code);
      else next.delete(code);
    }
    onChange([...next]);
  };

  return (
    <Collapse
      defaultActiveKey={grouped.map(([cat]) => cat)}
      items={grouped.map(([category, perms]) => {
        const codes = perms.map((p) => p.code);
        const checkedCount = codes.filter((c) => selected.has(c)).length;
        const allChecked = checkedCount === codes.length;
        const indeterminate = checkedCount > 0 && !allChecked;
        return {
          key: category,
          label: (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
              <Checkbox
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={(e) => toggleGroup(codes, e.target.checked)}
              >
                <strong>{PERMISSION_CATEGORY_LABEL[category]}</strong>{' '}
                <Typography.Text type="secondary">
                  ({checkedCount}/{codes.length})
                </Typography.Text>
              </Checkbox>
            </div>
          ),
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {perms.map((p) => (
                <Checkbox
                  key={p.code}
                  checked={selected.has(p.code)}
                  onChange={(e) => toggle(p.code, e.target.checked)}
                >
                  {p.name}{' '}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {p.code}
                  </Typography.Text>
                </Checkbox>
              ))}
            </div>
          ),
        };
      })}
    />
  );
}
