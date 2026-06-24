import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult
} from '@tanstack/react-query'
import {
  fetchCreatorContent,
  fetchCreatorContents,
  type CreatorContent,
  type Paginated
} from '../../api/content.api'
import { ApiError } from '../../lib/apiClient'

/** 무한 스크롤 페이지 크기. */
export const CONTENTS_PAGE_SIZE = 24

/** GET /creators/contents 무한 스크롤 조회 훅. searchValue 가 바뀌면 처음부터. */
export function useInfiniteCreatorContents(
  searchValue?: string
): UseInfiniteQueryResult<InfiniteData<Paginated<CreatorContent>>, ApiError> {
  return useInfiniteQuery({
    queryKey: ['creator-contents-infinite', searchValue ?? ''],
    queryFn: ({ pageParam }) =>
      fetchCreatorContents({ searchValue, page: pageParam, limit: CONTENTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    retry: false
  })
}

/** GET /creators/contents/:contentId 작품 상세(단건) 조회 훅. */
export function useCreatorContent(contentId: number): UseQueryResult<CreatorContent, ApiError> {
  return useQuery<CreatorContent, ApiError>({
    queryKey: ['creator-content', contentId],
    queryFn: () => fetchCreatorContent(contentId),
    enabled: Number.isFinite(contentId),
    retry: false
  })
}
