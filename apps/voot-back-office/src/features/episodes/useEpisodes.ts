import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchEpisode, fetchEpisodes, type EpisodeDetail, type EpisodeListItem } from '../../api/episodes.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';
import type { EpisodeStatus } from '@vooth/shared';

/** 콘텐츠 회차 목록 조회(서버 페이지네이션/검색/상태필터/단일정렬). */
export function useEpisodes(
  contentId: number,
  params?: {
    page?: number;
    limit?: number;
    searchValue?: string;
    statuses?: EpisodeStatus[];
    sort?: string;
    order?: 'ASC' | 'DESC';
  },
) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const searchValue = params?.searchValue?.trim() ?? '';
  const statuses = params?.statuses ?? [];
  const sort = params?.sort ?? '';
  const order = params?.order ?? '';
  return useQuery<PaginatedResponse<EpisodeListItem>, ApiError>({
    queryKey: ['episodes', contentId, page, limit, searchValue, statuses, sort, order],
    queryFn: () =>
      fetchEpisodes(contentId, {
        page,
        limit,
        searchValue,
        statuses,
        sort: sort || undefined,
        order: order || undefined,
      }),
    enabled: Number.isFinite(contentId),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** 회차 상세 조회(cuts/lines 포함). */
export function useEpisode(contentId: number, episodeId: number) {
  return useQuery<EpisodeDetail, ApiError>({
    queryKey: ['episode', contentId, episodeId],
    queryFn: () => fetchEpisode(contentId, episodeId),
    enabled: Number.isFinite(contentId) && Number.isFinite(episodeId),
    retry: false,
  });
}
