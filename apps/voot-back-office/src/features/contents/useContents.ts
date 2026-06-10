import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchContents, type ContentListItem, type FetchContentsParams } from '../../api/contents.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const contentsQueryKey = (params: FetchContentsParams) => ['contents', params] as const;

/** 콘텐츠 목록(GET /admins/contents) 조회. 페이지/검색 전환 시 이전 데이터를 유지한다. */
export function useContents(params: FetchContentsParams) {
  return useQuery<PaginatedResponse<ContentListItem>, ApiError>({
    queryKey: contentsQueryKey(params),
    queryFn: () => fetchContents(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
