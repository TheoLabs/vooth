import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchCreatorEpisodes, type CreatorEpisode } from '../../api/episode.api'
import { type Paginated } from '../../api/content.api'
import { ApiError } from '../../lib/apiClient'

/** GET /creators/contents/:contentId/episodes 회차 목록 조회 훅. searchValue 가 바뀌면 재요청. */
export function useCreatorEpisodes(
  contentId: number,
  searchValue?: string
): UseQueryResult<Paginated<CreatorEpisode>, ApiError> {
  return useQuery<Paginated<CreatorEpisode>, ApiError>({
    queryKey: ['creator-episodes', contentId, searchValue ?? ''],
    queryFn: () => fetchCreatorEpisodes(contentId, { searchValue }),
    enabled: Number.isFinite(contentId),
    placeholderData: keepPreviousData,
    retry: false
  })
}
