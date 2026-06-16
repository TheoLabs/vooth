import { useMemo, useState } from 'react';
import { Avatar, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DEFAULT_PAGE_SIZE, FullHeightTable } from '../../components/FullHeightTable';
import { TableToolbar } from '../../components/TableToolbar';
import { CreatorDetailDrawer } from './CreatorDetailDrawer';
import { useCreators } from './useCreators';
import { avatarColor, type Creator } from './creator.types';

const SEARCH_KEYS = [
  { value: 'nickname', label: '활동명' },
  { value: 'email', label: '이메일' },
];

/** UTC ISO → 로컬 날짜(YYYY-MM-DD). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreatorsPage() {
  const [searchKey, setSearchKey] = useState<'nickname' | 'email'>('nickname');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useMemo(
    () => ({
      searchKey: searchValue ? searchKey : undefined,
      searchValue: searchValue || undefined,
      page,
      limit: pageSize,
    }),
    [searchKey, searchValue, page, pageSize],
  );

  const { data, isLoading } = useCreators(query);

  const [detailId, setDetailId] = useState<number | null>(null);
  const detailCreator = useMemo(
    () => data?.items.find((c) => c.id === detailId) ?? null,
    [data, detailId],
  );

  const columns: ColumnsType<Creator> = [
    {
      title: '성우',
      key: 'profile',
      render: (_, c) => (
        <Space>
          <Avatar style={{ backgroundColor: avatarColor(c.nickname), flex: 'none' }}>
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
      title: '참여 작품',
      dataIndex: 'castingCount',
      key: 'castingCount',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.castingCount - b.castingCount,
      render: (v: number) => `${v}편`,
    },
    {
      title: '녹음 회차',
      dataIndex: 'episodeCount',
      key: 'episodeCount',
      width: 110,
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
        searchKeys={SEARCH_KEYS}
        searchKey={searchKey}
        onSearchKeyChange={(v) => setSearchKey(v as 'nickname' | 'email')}
        searchValue={searchInput}
        onSearchValueChange={setSearchInput}
        onSearch={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        placeholder="활동명 또는 이메일 검색"
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
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            if (nextSize !== pageSize) {
              setPageSize(nextSize);
              setPage(1);
            } else {
              setPage(nextPage);
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
