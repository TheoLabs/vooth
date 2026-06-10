import { useQuery } from '@tanstack/react-query';
import { fetchCharacters, type CharacterListItem } from '../../api/characters.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 등장인물 목록 조회. 보통 수가 적어 한 번에 받는다(limit 100). */
export function useCharacters(contentId: number) {
  return useQuery<PaginatedResponse<CharacterListItem>, ApiError>({
    queryKey: ['characters', contentId],
    queryFn: () => fetchCharacters(contentId, { page: 1, limit: 100 }),
    enabled: Number.isFinite(contentId),
    retry: false,
  });
}
