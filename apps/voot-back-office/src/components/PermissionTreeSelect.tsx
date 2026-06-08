import { useMemo, useState } from 'react';
import { Alert, Empty, Flex, Input, Spin, Tree, Typography } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { PermissionCategory } from '@vooth/shared';
import { usePermissionCatalog } from '../features/permissions/usePermissionCatalog';
import type { PermissionItem } from '../api/permissions.api';
import { PERMISSION_CATEGORY_META } from '../mocks/permissions.mock';
import './permission-tree-select.css';

interface PermissionTreeSelectProps {
  /** 선택된 권한 code 목록 (Form.Item 이 주입) */
  value?: string[];
  onChange?: (value: string[]) => void;
}

const categoryKey = (category: PermissionCategory) => `category:${category}`;

const categoryLabel = (category: PermissionCategory) =>
  PERMISSION_CATEGORY_META[category]?.label ?? category;

/** 권한 목록을 카테고리별로 묶는다. 카탈로그 순서를 유지한다. */
function groupByCategory(
  items: PermissionItem[],
): [PermissionCategory, PermissionItem[]][] {
  const map = new Map<PermissionCategory, PermissionItem[]>();
  for (const item of items) {
    const list = map.get(item.category);
    if (list) list.push(item);
    else map.set(item.category, [item]);
  }
  return [...map.entries()];
}

function buildCategoryNode(
  category: PermissionCategory,
  perms: PermissionItem[],
  total: number,
): DataNode {
  return {
    key: categoryKey(category),
    // 카테고리 자체는 선택 대상이 아니므로 라벨만 표시한다.
    selectable: false,
    title: (
      <span className="perm-tree__group">
        {categoryLabel(category)}
        <span className="perm-tree__group-count">
          {perms.length === total ? total : `${perms.length}/${total}`}
        </span>
      </span>
    ),
    children: perms.map((perm) => ({
      key: perm.code,
      selectable: false,
      title: (
        <span className="perm-tree__leaf">
          <span className="perm-tree__leaf-desc">{perm.name}</span>
          <code className="perm-tree__leaf-action">{perm.code}</code>
        </span>
      ),
    })),
  };
}

/**
 * 검색 + 카테고리 체크박스 트리로 권한을 선택한다.
 * 권한 수가 많아질 수 있어 스크롤 영역과 검색 필터를 제공하고,
 * 검색으로 가려진 선택 항목도 유지한다.
 */
export function PermissionTreeSelect({
  value = [],
  onChange,
}: PermissionTreeSelectProps) {
  const { data: permissions, isPending, isError, error } = usePermissionCatalog();
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const codeSet = useMemo(
    () => new Set((permissions ?? []).map((p) => p.code)),
    [permissions],
  );

  const grouped = useMemo(
    () => groupByCategory(permissions ?? []),
    [permissions],
  );

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // 검색어로 필터링된 트리 + 펼칠 카테고리 + 현재 보이는 leaf code 집합.
  const { treeData, searchExpandedKeys, visibleCodes } = useMemo(() => {
    const nodes: DataNode[] = [];
    const expanded: React.Key[] = [];
    const visible = new Set<string>();

    for (const [category, perms] of grouped) {
      const label = categoryLabel(category).toLowerCase();
      const categoryMatch = label.includes(query);
      const matched =
        !isSearching || categoryMatch
          ? perms
          : perms.filter(
              (p) =>
                p.code.toLowerCase().includes(query) ||
                p.name.toLowerCase().includes(query),
            );

      if (matched.length === 0) continue;

      nodes.push(buildCategoryNode(category, matched, perms.length));
      expanded.push(categoryKey(category));
      matched.forEach((p) => visible.add(p.code));
    }

    return {
      treeData: nodes,
      searchExpandedKeys: expanded,
      visibleCodes: visible,
    };
  }, [grouped, query, isSearching]);

  const handleCheck: TreeProps['onCheck'] = (checked) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    // 현재 보이는 leaf 중 체크된 것
    const checkedVisible = (keys as React.Key[])
      .map(String)
      .filter((k) => codeSet.has(k));
    // 검색으로 가려진(현재 트리에 없는) 기존 선택은 그대로 유지한다.
    const preserved = value.filter((c) => !visibleCodes.has(c));
    onChange?.([...new Set([...preserved, ...checkedVisible])]);
  };

  if (isPending) {
    return (
      <div className="perm-tree perm-tree--center">
        <Spin />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="권한 목록을 불러오지 못했습니다."
        description={error?.message}
      />
    );
  }

  return (
    <div className="perm-tree">
      <Flex align="center" justify="space-between" gap={8} className="perm-tree__toolbar">
        <Input.Search
          allowClear
          placeholder="권한 검색 (이름 / code)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Typography.Text type="secondary" className="perm-tree__count">
          선택 {value.length}개
        </Typography.Text>
      </Flex>

      <div className="perm-tree__body">
        {treeData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="검색 결과가 없습니다."
          />
        ) : (
          <Tree
            checkable
            selectable={false}
            treeData={treeData}
            checkedKeys={value}
            onCheck={handleCheck}
            expandedKeys={isSearching ? searchExpandedKeys : expandedKeys}
            onExpand={(keys) => {
              // 검색 중에는 펼침 상태를 검색 결과가 제어한다.
              if (!isSearching) setExpandedKeys(keys);
            }}
          />
        )}
      </div>
    </div>
  );
}
