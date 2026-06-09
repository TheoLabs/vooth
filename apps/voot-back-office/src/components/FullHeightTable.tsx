import { useLayoutEffect, useRef, useState } from 'react';
import { Table, Typography } from 'antd';
import type { TableProps } from 'antd';

/**
 * 백오피스 레이아웃 룰용 테이블.
 * 남은 높이를 모두 채우고, 스크롤은 테이블 "내부 body" 에만 생기게 한다.
 * (헤더/페이지네이션은 고정, 바깥 페이지 스크롤 없음)
 *
 * 부모는 높이가 제한된 flex 컨테이너여야 한다(.bo-page 안의 flex:1 영역).
 *
 * 모든 리스트/테이블 페이지는 상단에 항상 "총 N건" 합계를 표시한다.
 * 합계는 서버 페이지네이션의 `pagination.total` 을 우선 사용하고,
 * 페이지네이션이 없으면 현재 행 수(`dataSource.length`)로 대체한다.
 */
export function FullHeightTable<T extends object>(props: TableProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const total = el.clientHeight;
      // 상단 합계 라벨 영역 높이.
      const summary =
        el.querySelector<HTMLElement>('.bo-table-summary')?.offsetHeight ?? 0;
      // 스크롤이 설정되면 헤더가 별도 테이블로 분리된다(.ant-table-header).
      const header =
        el.querySelector<HTMLElement>('.ant-table-header')?.offsetHeight ??
        el.querySelector<HTMLElement>('.ant-table-thead')?.offsetHeight ??
        55;
      const pagination = el.querySelector<HTMLElement>('.ant-pagination');
      // 페이지네이션 높이 + 상단 마진(16) 보정.
      const paginationHeight = pagination ? pagination.offsetHeight + 16 : 0;
      setBodyHeight(Math.max(120, total - summary - header - paginationHeight));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 합계: 서버 페이지네이션 total 우선, 없으면 현재 행 수.
  const totalCount =
    props.pagination && props.pagination.total != null
      ? props.pagination.total
      : (props.dataSource?.length ?? 0);

  return (
    <div ref={ref} className="bo-table-fill">
      <div className="bo-table-summary">
        <Typography.Text type="secondary">
          총 {totalCount.toLocaleString()}건
        </Typography.Text>
      </div>
      <Table<T> {...props} scroll={{ ...props.scroll, y: bodyHeight }} />
    </div>
  );
}
