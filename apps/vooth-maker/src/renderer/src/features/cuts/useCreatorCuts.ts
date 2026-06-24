import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchCreatorCuts, type CreatorCut } from '../../api/cut.api'
import { type Paginated } from '../../api/content.api'
import { ApiError } from '../../lib/apiClient'

/** GET /creators/episodes/:episodeId/cuts 회차 컷(+대사) 목록 조회 훅. */
export function useCreatorCuts(episodeId: number): UseQueryResult<Paginated<CreatorCut>, ApiError> {
  return useQuery<Paginated<CreatorCut>, ApiError>({
    queryKey: ['creator-cuts', episodeId],
    queryFn: () => fetchCreatorCuts(episodeId),
    enabled: Number.isFinite(episodeId),
    refetchOnWindowFocus: false,
    retry: false
  })
}
