import { useEffect, useMemo, useRef, useState } from 'react';
import { Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface FullHeightTableProps<T> extends TableProps<T> {
  /** 서버 응답 total (총 N건 표시용) */
  total?: number;
}

/** 목록 기본 페이지 크기. 페이지네이션을 쓰는 화면은 이 값을 초기값으로 둔다. */
export const DEFAULT_PAGE_SIZE = 30;
/** 페이지 크기 선택 옵션(가장 왼쪽 셀렉트). */
export const PAGE_SIZE_OPTIONS = ['30', '50', '100'];

/**
 * 백오피스 공용 목록 테이블.
 * - 남은 높이를 모두 채우고, 스크롤은 테이블 body 내부에만 생긴다(바깥 스크롤 금지).
 * - 상단에 항상 `총 N건` 합계를 렌더링한다.
 * - 일반 antd <Table> 대신 모든 리스트 화면에서 이 컴포넌트를 쓴다.
 */
export function FullHeightTable<T extends object>({
  total,
  pagination,
  columns,
  ...rest
}: FullHeightTableProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number>(320);

  // 현재 페이지 오프셋을 반영한 순번(#) 컬럼을 항상 맨 앞에 붙인다.
  const columnsWithIndex = useMemo<ColumnsType<T>>(() => {
    const current = (pagination && pagination.current) || 1;
    const pageSize = (pagination && pagination.pageSize) || 0;
    const offset = (current - 1) * pageSize;
    const indexColumn: ColumnsType<T>[number] = {
      title: '#',
      key: '__index',
      width: 60,
      align: 'center',
      render: (_value, _record, index) => (
        <Typography.Text type="secondary">{offset + index + 1}</Typography.Text>
      ),
    };
    return [indexColumn, ...(columns ?? [])];
  }, [columns, pagination]);

  // 페이지네이션을 쓰는 화면은 항상 페이지 크기 셀렉트(30/50/100)를 노출한다.
  const mergedPagination =
    pagination === false || pagination == null
      ? pagination
      : {
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          ...pagination,
          showSizeChanger: true,
        };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const recalc = () => {
      const wrapperHeight = wrapper.clientHeight;
      // header(테이블 헤더) + pagination 영역을 제외한 높이를 body 스크롤에 할당.
      const header = wrapper.querySelector<HTMLElement>('.ant-table-thead');
      const pager = wrapper.querySelector<HTMLElement>('.ant-pagination');
      const headerH = header?.offsetHeight ?? 55;
      // 페이지네이션은 상·하 마진(기본 16px씩)을 포함해 차지하는 전체 높이를 빼야
      // 바깥 overflow:hidden 에 하단이 잘리지 않는다.
      let pagerH = 0;
      if (pager) {
        const style = getComputedStyle(pager);
        pagerH =
          pager.offsetHeight +
          parseFloat(style.marginTop || '0') +
          parseFloat(style.marginBottom || '0');
      }
      const next = Math.max(120, wrapperHeight - headerH - pagerH);
      setScrollY(next);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(wrapper);
    // 페이지네이션 자체 높이 변화(크기 변경 셀렉트 줄바꿈 등)도 반영.
    const pager = wrapper.querySelector<HTMLElement>('.ant-pagination');
    if (pager) observer.observe(pager);
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
          pagination={mergedPagination}
          columns={columnsWithIndex}
          {...rest}
        />
      </div>
    </div>
  );
}
