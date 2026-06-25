import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchCreatorCuts, type CreatorCutsResponse } from '../../api/cut.api'
import { ApiError } from '../../lib/apiClient'

/** GET /creators/episodes/:episodeId/cuts 회차 컷(+대사) + 캐릭터 조회 훅. */
export function useCreatorCuts(episodeId: number): UseQueryResult<CreatorCutsResponse, ApiError> {
  return useQuery<CreatorCutsResponse, ApiError>({
    queryKey: ['creator-cuts', episodeId],
    queryFn: () => fetchCreatorCuts(episodeId),
    enabled: Number.isFinite(episodeId),
    refetchOnWindowFocus: false,
    retry: false
  })
}
