import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTags, type FetchTagsParams, type TagListItem } from '../../api/tags.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const tagsQueryKey = (params: FetchTagsParams) => ['tags', params] as const;

/** 태그 목록(GET /admins/tags) 조회. 페이지/검색 전환 시 이전 데이터를 유지한다. */
export function useTags(params: FetchTagsParams, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse<TagListItem>, ApiError>({
    queryKey: tagsQueryKey(params),
    queryFn: () => fetchTags(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
