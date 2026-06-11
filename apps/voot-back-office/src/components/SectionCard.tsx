import type { CSSProperties, ReactNode } from 'react';
import { Button, Card, Space } from 'antd';

interface SectionCardProps {
  title: ReactNode;
  /** 우상단 커스텀 액션(버튼 등). onEdit 과 함께 쓰면 그 왼쪽에 배치된다. */
  extra?: ReactNode;
  /** 지정 시 우상단에 표준 "수정" 버튼을 렌더하고 클릭 시 호출한다. */
  onEdit?: () => void;
  editText?: string;
  editDisabled?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * 상세 화면의 섹션 카드. `size="small"` + 제목 + 우상단 액션(수정 버튼)을 표준화한다.
 * - `onEdit` 만 주면 표준 "수정" 버튼이, `extra` 만 주면 커스텀 액션이 렌더된다.
 */
export function SectionCard({
  title,
  extra,
  onEdit,
  editText = '수정',
  editDisabled,
  children,
  style,
  className,
}: SectionCardProps) {
  const actions =
    onEdit !== undefined ? (
      <Space>
        {extra}
        <Button size="small" onClick={onEdit} disabled={editDisabled}>
          {editText}
        </Button>
      </Space>
    ) : (
      extra
    );

  return (
    <Card size="small" title={title} extra={actions} style={style} className={className}>
      {children}
    </Card>
  );
}
