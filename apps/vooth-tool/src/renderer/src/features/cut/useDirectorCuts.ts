import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchDirectorCuts, type DirectorCut } from '../../api/cut.api'
import { type Paginated } from '../../api/episode.api'
import { ApiError } from '../../lib/apiClient'

/** GET /directors/episodes/:episodeId/cuts 회차 컷(+대사) 목록 조회 훅. */
export function useDirectorCuts(
  episodeId: number
): UseQueryResult<Paginated<DirectorCut>, ApiError> {
  return useQuery<Paginated<DirectorCut>, ApiError>({
    queryKey: ['director-cuts', episodeId],
    queryFn: () => fetchDirectorCuts(episodeId),
    enabled: Number.isFinite(episodeId),
    refetchOnWindowFocus: false,
    retry: false
  })
}
