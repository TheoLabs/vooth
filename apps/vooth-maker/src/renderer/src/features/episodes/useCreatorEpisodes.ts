import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  fetchCreatorEpisode,
  fetchCreatorEpisodes,
  type CreatorEpisode,
  type CreatorEpisodeDetail
} from '../../api/episode.api'
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

/** GET /creators/contents/:contentId/episodes/:episodeId 회차 상세 조회 훅. */
export function useCreatorEpisode(
  contentId: number,
  episodeId: number
): UseQueryResult<CreatorEpisodeDetail, ApiError> {
  return useQuery<CreatorEpisodeDetail, ApiError>({
    queryKey: ['creator-episode', contentId, episodeId],
    queryFn: () => fetchCreatorEpisode(contentId, episodeId),
    enabled: Number.isFinite(contentId) && Number.isFinite(episodeId),
    refetchOnWindowFocus: false,
    retry: false
  })
}
