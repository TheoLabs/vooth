import { useQuery } from '@tanstack/react-query';
import { fetchCreators } from '../../api/creator.api';
import type { ApiError } from '../../lib/apiClient';
import { toCreator, type Creator, type CreatorListQuery } from './creator.types';

const CREATORS_KEY = 'creators';

interface CreatorListResult {
  items: Creator[];
  total: number;
}

/**
 * 성우 목록 훅.
 * - `GET /admins/creators` 로 조회 후 성우 뷰모델로 매핑한다.
 * - 캐스팅/회차 집계는 toCreator() 에서 목(mock) 으로 보강한다(집계 API 준비 전).
 */
export function useCreators(query: CreatorListQuery) {
  const result = useQuery<CreatorListResult, ApiError>({
    queryKey: [CREATORS_KEY, query],
    queryFn: async () => {
      const res = await fetchCreators({
        searchKey: query.searchValue ? 'nickname' : undefined,
        searchValue: query.searchValue,
        page: query.page,
        limit: query.limit,
      });
      return { items: res.items.map(toCreator), total: res.total };
    },
    placeholderData: (prev) => prev,
  });

  return { data: result.data, isLoading: result.isLoading };
}
