import type { ReactNode } from 'react';
import { Flex, Typography } from 'antd';
import './FilterBar.css';

/**
 * 모든 필터 컨트롤의 고정 너비(px). 다중 선택 태그가 늘어도 컨트롤이
 * 가로로 늘어나지 않도록 여기서 일괄 고정한다.
 */
const FILTER_FIELD_WIDTH = 220;

/**
 * 필터 바의 한 칸: 라벨(상단) + 컨트롤(하단).
 * 백오피스 룰상 모든 목록 필터는 검색창 하단 필터 바에 이 패턴으로 배치한다.
 * 컨트롤은 고정 너비 래퍼로 감싸고, 자식이 래퍼를 꽉 채우도록 강제한다.
 * (닫힌 컨트롤만 너비 제한되며, 드롭다운 메뉴는 옵션 라벨을 그대로 보여준다.)
 */
export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Flex vertical gap={4} className="bo-filter-field">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <div style={{ width: FILTER_FIELD_WIDTH }}>{children}</div>
    </Flex>
  );
}

/**
 * 검색창 하단에 놓는 필터 바. 필터 축이 늘면 FilterField 를 추가한다.
 * 좁은 화면에서는 줄바꿈된다.
 */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Flex gap={16} wrap align="flex-end" style={{ width: '100%' }}>
      {children}
    </Flex>
  );
}
