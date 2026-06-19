import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Avatar, Empty, Input, Modal, Spin, Typography } from 'antd';
import { fetchCreators } from '../../api/creator.api';
import { avatarColor } from '../creators/creator.types';

const PAGE_SIZE = 20;

export interface PickedCreator {
  id: number;
  nickname: string;
  realName: string;
  avatarUrl: string | null;
}

interface CastingPickerModalProps {
  open: boolean;
  /** 이미 캐스팅된 성우 id (목록에서 '캐스팅됨' 표시) */
  assignedIds: number[];
  onClose: () => void;
  onPick: (creator: PickedCreator) => void;
}

/**
 * 성우(크리에이터)를 검색해 캐릭터에 캐스팅하는 피커.
 * 성우가 많은 경우를 가정해 검색 + 무한 스크롤(누적 로드).
 * 목록은 실제 `GET /admins/creators`(페이지네이션).
 */
export function CastingPickerModal({
  open,
  assignedIds,
  onClose,
  onPick,
}: CastingPickerModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // 모달 열릴 때 검색 초기화
  useEffect(() => {
    if (open) {
      setSearchInput('');
      setSearch('');
    }
  }, [open]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['casting-creator-picker', search],
    enabled: open,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCreators({
        searchKey: search ? 'nickname' : undefined,
        searchValue: search || undefined,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const creators = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (hasNextPage && !isFetchingNextPage && el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      fetchNextPage();
    }
  };

  return (
    <Modal
      title="성우 캐스팅"
      open={open}
      onCancel={onClose}
      maskClosable={false}
      footer={null}
      width={440}
    >
      <Input.Search
        allowClear
        placeholder="활동명 검색"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onSearch={(v) => setSearch(v.trim())}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '12px 0 8px',
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          총 {total}명
        </Typography.Text>
        {total > 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {creators.length} / {total} 표시
          </Typography.Text>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <Spin />
        </div>
      ) : total === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="성우가 없습니다."
          style={{ margin: '32px 0' }}
        />
      ) : (
        <div
          onScroll={onScroll}
          style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {creators.map((c) => {
            const assigned = assignedIds.includes(c.id);
            return (
              <div
                key={c.id}
                role="button"
                onClick={() =>
                  !assigned &&
                  onPick({
                    id: c.id,
                    nickname: c.nickname,
                    realName: c.account.name,
                    avatarUrl: c.avatarUrl,
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 6px',
                  borderRadius: 8,
                  cursor: assigned ? 'default' : 'pointer',
                  opacity: assigned ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!assigned) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  src={c.avatarUrl ?? undefined}
                  style={{
                    flex: 'none',
                    background: c.avatarUrl ? undefined : avatarColor(c.nickname),
                  }}
                >
                  {c.nickname.slice(0, 1)}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                  <Typography.Text strong>{c.nickname}</Typography.Text>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {c.account.name || c.account.email}
                    </Typography.Text>
                  </div>
                </div>
                {assigned && (
                  <Typography.Text type="secondary" style={{ fontSize: 12, flex: 'none' }}>
                    캐스팅됨
                  </Typography.Text>
                )}
              </div>
            );
          })}

          {isFetchingNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <Spin size="small" />
            </div>
          )}
          {hasNextPage && !isFetchingNextPage && (
            <Typography.Text
              type="secondary"
              style={{ textAlign: 'center', fontSize: 12, padding: '10px 0' }}
            >
              스크롤하면 더 불러옵니다…
            </Typography.Text>
          )}
        </div>
      )}
    </Modal>
  );
}
