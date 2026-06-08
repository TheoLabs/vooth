import type { ReactNode } from 'react';
import { Flex, Typography } from 'antd';

/**
 * 필터 바의 한 칸: 라벨(상단) + 컨트롤(하단).
 * 백오피스 룰상 모든 목록 필터는 검색창 하단 필터 바에 이 패턴으로 배치한다.
 */
export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Flex vertical gap={4}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      {children}
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
