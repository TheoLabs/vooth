import { useMemo, useState } from 'react';
import { Alert, Empty, Flex, Input, Spin, Tree, Typography } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { usePermissionCatalog } from '../features/permissions/usePermissionCatalog';
import type { PermissionItem } from '../api/permissions.api';
import './permission-tree-select.css';

interface PermissionTreeSelectProps {
  /** 선택된 권한 action 목록 (Form.Item 이 주입) */
  value?: string[];
  onChange?: (value: string[]) => void;
}

const groupKey = (group: string) => `group:${group}`;

/** 권한 목록을 그룹별로 묶는다. 카탈로그 순서를 유지한다. */
function groupPermissions(items: PermissionItem[]): [string, PermissionItem[]][] {
  const map = new Map<string, PermissionItem[]>();
  for (const item of items) {
    const list = map.get(item.group);
    if (list) list.push(item);
    else map.set(item.group, [item]);
  }
  return [...map.entries()];
}

function buildGroupNode(
  group: string,
  perms: PermissionItem[],
  total: number,
): DataNode {
  return {
    key: groupKey(group),
    // 그룹 자체는 선택 대상이 아니므로 라벨만 표시한다.
    selectable: false,
    title: (
      <span className="perm-tree__group">
        {group}
        <span className="perm-tree__group-count">
          {perms.length === total ? total : `${perms.length}/${total}`}
        </span>
      </span>
    ),
    children: perms.map((perm) => ({
      key: perm.action,
      selectable: false,
      title: (
        <span className="perm-tree__leaf">
          <span className="perm-tree__leaf-desc">{perm.description}</span>
          <code className="perm-tree__leaf-action">{perm.action}</code>
        </span>
      ),
    })),
  };
}

/**
 * 검색 + 그룹 체크박스 트리로 권한을 선택한다.
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

  const actionSet = useMemo(
    () => new Set((permissions ?? []).map((p) => p.action)),
    [permissions],
  );

  const grouped = useMemo(
    () => groupPermissions(permissions ?? []),
    [permissions],
  );

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // 검색어로 필터링된 트리 + 펼칠 그룹 + 현재 보이는 leaf action 집합.
  const { treeData, searchExpandedKeys, visibleActions } = useMemo(() => {
    const nodes: DataNode[] = [];
    const expanded: React.Key[] = [];
    const visible = new Set<string>();

    for (const [group, perms] of grouped) {
      const groupMatch = group.toLowerCase().includes(query);
      const matched =
        !isSearching || groupMatch
          ? perms
          : perms.filter(
              (p) =>
                p.action.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query),
            );

      if (matched.length === 0) continue;

      nodes.push(buildGroupNode(group, matched, perms.length));
      expanded.push(groupKey(group));
      matched.forEach((p) => visible.add(p.action));
    }

    return {
      treeData: nodes,
      searchExpandedKeys: expanded,
      visibleActions: visible,
    };
  }, [grouped, query, isSearching]);

  const handleCheck: TreeProps['onCheck'] = (checked) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    // 현재 보이는 leaf 중 체크된 것
    const checkedVisible = (keys as React.Key[])
      .map(String)
      .filter((k) => actionSet.has(k));
    // 검색으로 가려진(현재 트리에 없는) 기존 선택은 그대로 유지한다.
    const preserved = value.filter((a) => !visibleActions.has(a));
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
          placeholder="권한 검색 (이름 / action)"
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
