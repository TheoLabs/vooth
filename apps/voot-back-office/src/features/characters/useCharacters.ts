import { useQuery } from '@tanstack/react-query';
import { fetchCharacters, type CharacterListItem } from '../../api/characters.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

/**
 * 콘텐츠 등장인물 목록 조회(limit 100). 정렬은 서버(sort/order)로 처리한다.
 * 기본 정렬 = type ASC(주연 10 → 조연 20 → 단역 30).
 */
export function useCharacters(contentId: number, params?: { sort?: 'name' | 'type'; order?: 'ASC' | 'DESC' }) {
  const sort = params?.sort ?? 'type';
  const order = params?.order ?? 'ASC';
  return useQuery<PaginatedResponse<CharacterListItem>, ApiError>({
    queryKey: ['characters', contentId, sort, order],
    queryFn: () => fetchCharacters(contentId, { page: 1, limit: 100, sort, order }),
    enabled: Number.isFinite(contentId),
    retry: false,
  });
}
