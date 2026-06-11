import { useQuery } from '@tanstack/react-query';
import { fetchCreators, type CreatorListItem } from '../../api/creators.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

/** 크리에이터(성우) 목록 조회. 캐스팅 피커용으로 한 번에 받는다(limit 100). */
export function useCreators(options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse<CreatorListItem>, ApiError>({
    queryKey: ['creators'],
    queryFn: () => fetchCreators({ page: 1, limit: 100 }),
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
