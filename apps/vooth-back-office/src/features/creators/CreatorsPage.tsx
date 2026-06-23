import { useMemo, useState } from 'react';
import { Avatar, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { numberParam, stringParam, useUrlQuery } from '../../hooks/useUrlQuery';
import { CreatorDetailDrawer } from './CreatorDetailDrawer';
import { useCreators } from './useCreators';
import { avatarColor, type Creator } from './creator.types';

/** UTC ISO → 로컬 날짜(YYYY-MM-DD). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreatorsPage() {
  const [q, setQ] = useUrlQuery({
    q: stringParam(),
    page: numberParam(1),
    limit: numberParam(DEFAULT_PAGE_SIZE),
  });
  const [searchInput, setSearchInput] = useState(q.q);

  const query = useMemo(
    () => ({
      searchValue: q.q || undefined,
      page: q.page,
      limit: q.limit,
    }),
    [q.q, q.page, q.limit],
  );

  const { data, isLoading } = useCreators(query);

  const [detailId, setDetailId] = useState<number | null>(null);
  const detailCreator = useMemo(
    () => data?.items.find((c) => c.id === detailId) ?? null,
    [data, detailId],
  );

  const columns: ColumnsType<Creator> = [
    {
      title: '성우(활동명)',
      key: 'profile',
      render: (_, c) => (
        <Space>
          <Avatar
            src={c.avatarUrl ?? undefined}
            style={{ backgroundColor: avatarColor(c.nickname), flex: 'none' }}
          >
            {c.nickname.slice(0, 1)}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Typography.Text strong>{c.nickname}</Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {c.email}
              </Typography.Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '본명',
      dataIndex: 'realName',
      key: 'realName',
      width: 140,
      render: (realName: string) => realName || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: '참여 작품 (M)',
      dataIndex: 'castingCount',
      key: 'castingCount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.castingCount - b.castingCount,
      render: (v: number) => `${v}편`,
    },
    {
      title: '녹음 회차 (M)',
      dataIndex: 'episodeCount',
      key: 'episodeCount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.episodeCount - b.episodeCount,
      render: (v: number) => `${v}화`,
    },
    {
      title: '가입일',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 130,
      sorter: (a, b) => a.joinedAt.localeCompare(b.joinedAt),
      render: (iso: string) => formatDate(iso),
    },
  ];

  return (
    <div className="bo-page">
      <Typography.Title level={3} style={{ margin: 0 }}>
        성우 목록
      </Typography.Title>

      <TableToolbar
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => setQ({ q: v, page: 1 })}
        placeholder="활동명 검색"
      />

      <FullHeightTable<Creator>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        total={data?.total}
        onRow={(creator) => ({
          onClick: () => setDetailId(creator.id),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: q.page,
          pageSize: q.limit,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== q.limit) {
              setQ({ limit: nextSize, page: 1 });
            } else {
              setQ({ page: nextPage });
            }
          },
        }}
      />

      <CreatorDetailDrawer
        creator={detailCreator}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
