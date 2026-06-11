import { useQuery } from '@tanstack/react-query';
import { fetchCastings, type CastingListItem } from '../../api/castings.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 캐스팅 목록 조회. 보통 수가 적어 한 번에 받는다(limit 100). */
export function useCastings(contentId: number, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse<CastingListItem>, ApiError>({
    queryKey: ['castings', contentId],
    queryFn: () => fetchCastings(contentId, { page: 1, limit: 100 }),
    enabled: Number.isFinite(contentId) && (options?.enabled ?? true),
    retry: false,
  });
}
