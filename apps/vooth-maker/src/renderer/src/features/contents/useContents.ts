import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchContents } from '../../api/contents.api'
import { useAuth } from '../../auth/AuthContext'

const PAGE_SIZE = 12

/** 성우용 게시 콘텐츠 목록(무한 스크롤). */
export function useContents() {
  const { user } = useAuth()
  return useInfiniteQuery({
    queryKey: ['contents'],
    queryFn: ({ pageParam }) => fetchContents({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    enabled: Boolean(user),
    retry: false,
  })
}
