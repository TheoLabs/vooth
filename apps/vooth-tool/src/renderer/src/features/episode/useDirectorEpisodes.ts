import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import {
  changeEpisodeStatus,
  fetchDirectorEpisode,
  fetchDirectorEpisodes,
  type DirectorEpisode,
  type DirectorEpisodeListParams,
  type Paginated
} from '../../api/episode.api'
import { type EpisodeStatus } from '../../domain/types'
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

/** GET /directors/contents/:contentId/episodes/:episodeId 회차 상세(메타) 훅. */
export function useDirectorEpisode(
  contentId: number,
  episodeId: number
): UseQueryResult<DirectorEpisode, ApiError> {
  return useQuery<DirectorEpisode, ApiError>({
    queryKey: ['director-episode', contentId, episodeId],
    queryFn: () => fetchDirectorEpisode(contentId, episodeId),
    enabled: Number.isFinite(contentId) && Number.isFinite(episodeId),
    retry: false
  })
}

/** PUT 회차 상태 전이(DRAFT↔READY) 뮤테이션. 성공 시 상세·목록 무효화. */
export function useChangeEpisodeStatus(
  contentId: number,
  episodeId: number
): UseMutationResult<unknown, ApiError, EpisodeStatus> {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, EpisodeStatus>({
    mutationFn: (status) => changeEpisodeStatus(contentId, episodeId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-episode', contentId, episodeId] })
      queryClient.invalidateQueries({ queryKey: ['director-episodes', contentId] })
    }
  })
}
