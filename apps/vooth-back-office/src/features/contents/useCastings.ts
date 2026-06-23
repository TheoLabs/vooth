import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  changeCastingPublish,
  createCasting,
  deleteCasting,
  fetchCastings,
  type AdminCasting,
  type CreateCastingInput,
} from '../../api/casting.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const CASTINGS_KEY = 'castings';

/** 캐릭터의 캐스팅 목록(GET /admins/characters/:characterId/castings). */
export function useCastings(
  characterId: number | null,
): UseQueryResult<PaginatedResponse<AdminCasting>, ApiError> {
  return useQuery<PaginatedResponse<AdminCasting>, ApiError>({
    queryKey: [CASTINGS_KEY, 'list', characterId],
    queryFn: () => fetchCastings(characterId as number, { page: 1, limit: 100 }),
    enabled: characterId != null && Number.isFinite(characterId),
  });
}

/** 캐스팅 생성(POST). 성공 시 해당 캐릭터 캐스팅 목록 무효화. */
export function useCreateCasting(
  characterId: number,
): UseMutationResult<void, ApiError, CreateCastingInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateCastingInput>({
    mutationFn: (input) => createCasting(characterId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CASTINGS_KEY, 'list', characterId] }),
  });
}

/** 캐스팅 공개/비공개 변경(PUT :id/publish). 성공 시 해당 캐릭터 캐스팅 목록 무효화. */
export function useChangeCastingPublish(
  characterId: number,
): UseMutationResult<void, ApiError, { castingId: number; isPublished: boolean }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { castingId: number; isPublished: boolean }>({
    mutationFn: ({ castingId, isPublished }) =>
      changeCastingPublish(characterId, castingId, isPublished),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CASTINGS_KEY, 'list', characterId] }),
  });
}

/** 캐스팅 해제(DELETE). 성공 시 해당 캐릭터 캐스팅 목록 무효화. */
export function useDeleteCasting(
  characterId: number,
): UseMutationResult<void, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (castingId) => deleteCasting(characterId, castingId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CASTINGS_KEY, 'list', characterId] }),
  });
}
