import { useEffect, useRef, useState } from 'react';
import { Table, Typography } from 'antd';
import type { TableProps } from 'antd';

interface FullHeightTableProps<T> extends TableProps<T> {
  /** 서버 응답 total (총 N건 표시용) */
  total?: number;
}

/**
 * 백오피스 공용 목록 테이블.
 * - 남은 높이를 모두 채우고, 스크롤은 테이블 body 내부에만 생긴다(바깥 스크롤 금지).
 * - 상단에 항상 `총 N건` 합계를 렌더링한다.
 * - 일반 antd <Table> 대신 모든 리스트 화면에서 이 컴포넌트를 쓴다.
 */
export function FullHeightTable<T extends object>({
  total,
  pagination,
  ...rest
}: FullHeightTableProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number>(320);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const recalc = () => {
      const wrapperHeight = wrapper.clientHeight;
      // header(테이블 헤더) + pagination 영역을 제외한 높이를 body 스크롤에 할당.
      const header = wrapper.querySelector<HTMLElement>('.ant-table-thead');
      const pager = wrapper.querySelector<HTMLElement>('.ant-pagination');
      const headerH = header?.offsetHeight ?? 55;
      const pagerH = pager ? pager.offsetHeight + 16 : 0;
      const next = Math.max(120, wrapperHeight - headerH - pagerH);
      setScrollY(next);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bo-table-fill">
      <div className="bo-table-summary">
        <Typography.Text type="secondary">총 {total ?? 0}건</Typography.Text>
      </div>
      <div ref={wrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <Table<T>
          size="middle"
          scroll={{ y: scrollY }}
          pagination={pagination}
          {...rest}
        />
      </div>
    </div>
  );
}
