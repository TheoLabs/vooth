import { useLayoutEffect, useRef, useState } from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';

/**
 * 백오피스 레이아웃 룰용 테이블.
 * 남은 높이를 모두 채우고, 스크롤은 테이블 "내부 body" 에만 생기게 한다.
 * (헤더/페이지네이션은 고정, 바깥 페이지 스크롤 없음)
 *
 * 부모는 높이가 제한된 flex 컨테이너여야 한다(.bo-page 안의 flex:1 영역).
 */
export function FullHeightTable<T extends object>(props: TableProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const total = el.clientHeight;
      // 스크롤이 설정되면 헤더가 별도 테이블로 분리된다(.ant-table-header).
      const header =
        el.querySelector<HTMLElement>('.ant-table-header')?.offsetHeight ??
        el.querySelector<HTMLElement>('.ant-table-thead')?.offsetHeight ??
        55;
      const pagination = el.querySelector<HTMLElement>('.ant-pagination');
      // 페이지네이션 높이 + 상단 마진(16) 보정.
      const paginationHeight = pagination ? pagination.offsetHeight + 16 : 0;
      setBodyHeight(Math.max(120, total - header - paginationHeight));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="bo-table-fill">
      <Table<T> {...props} scroll={{ ...props.scroll, y: bodyHeight }} />
    </div>
  );
}
