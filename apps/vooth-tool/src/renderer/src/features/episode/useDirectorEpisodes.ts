import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  fetchDirectorEpisodes,
  type DirectorEpisode,
  type DirectorEpisodeListParams,
  type Paginated
} from '../../api/episode.api'
import { ApiError } from '../../lib/apiClient'

/** GET /directors/contents/:contentId/episodes 목록 조회 훅. */
export function useDirectorEpisodes(
  contentId: number,
  params: DirectorEpisodeListParams = {}
): UseQueryResult<Paginated<DirectorEpisode>, ApiError> {
  return useQuery<Paginated<DirectorEpisode>, ApiError>({
    queryKey: ['director-episodes', contentId, params],
    queryFn: () => fetchDirectorEpisodes(contentId, params),
    enabled: Number.isFinite(contentId),
    placeholderData: keepPreviousData,
    retry: false
  })
}
