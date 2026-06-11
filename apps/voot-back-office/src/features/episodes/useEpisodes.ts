import { useQuery } from '@tanstack/react-query';
import { fetchEpisodes, type EpisodeListItem } from '../../api/episodes.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 회차 목록 조회. */
export function useEpisodes(contentId: number) {
  return useQuery<PaginatedResponse<EpisodeListItem>, ApiError>({
    queryKey: ['episodes', contentId],
    queryFn: () => fetchEpisodes(contentId),
    enabled: Number.isFinite(contentId),
    retry: false,
  });
}
