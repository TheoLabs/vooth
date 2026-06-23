import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult
} from '@tanstack/react-query'
import {
  fetchDirectorContent,
  fetchDirectorContents,
  type DirectorContent,
  type DirectorContentListParams
} from '../../api/content.api'
import { type Paginated } from '../../api/episode.api'
import { ApiError } from '../../lib/apiClient'

/** 무한 스크롤 페이지 크기. */
export const CONTENTS_PAGE_SIZE = 24

/** GET /directors/contents 단일 페이지 조회 훅. */
export function useDirectorContents(
  params: DirectorContentListParams = {}
): UseQueryResult<Paginated<DirectorContent>, ApiError> {
  return useQuery<Paginated<DirectorContent>, ApiError>({
    queryKey: ['director-contents', params],
    queryFn: () => fetchDirectorContents(params),
    retry: false
  })
}

/** GET /directors/contents 무한 스크롤 조회 훅. searchValue 가 바뀌면 처음부터. */
export function useInfiniteDirectorContents(
  searchValue?: string
): UseInfiniteQueryResult<InfiniteData<Paginated<DirectorContent>>, ApiError> {
  return useInfiniteQuery({
    queryKey: ['director-contents-infinite', searchValue ?? ''],
    queryFn: ({ pageParam }) =>
      fetchDirectorContents({ searchValue, page: pageParam, limit: CONTENTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    retry: false
  })
}

/** GET /directors/contents/:id 단건 조회 훅(작품 상세 메타). */
export function useDirectorContent(contentId: number): UseQueryResult<DirectorContent, ApiError> {
  return useQuery<DirectorContent, ApiError>({
    queryKey: ['director-content', contentId],
    queryFn: () => fetchDirectorContent(contentId),
    enabled: Number.isFinite(contentId),
    retry: false
  })
}
