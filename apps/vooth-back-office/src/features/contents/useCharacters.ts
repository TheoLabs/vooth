import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createCharacter,
  fetchCharacter,
  fetchCharacters,
  updateCharacter,
  type AdminCharacter,
  type CharacterListQuery,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from '../../api/character.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const CHARACTERS_KEY = 'characters';

/** 작품의 캐릭터 목록(GET /admins/contents/:contentId/characters). */
export function useCharacters(
  contentId: number,
  query: CharacterListQuery = {},
): UseQueryResult<PaginatedResponse<AdminCharacter>, ApiError> {
  return useQuery<PaginatedResponse<AdminCharacter>, ApiError>({
    queryKey: [CHARACTERS_KEY, 'list', contentId, query],
    queryFn: () => fetchCharacters(contentId, query),
    enabled: Number.isFinite(contentId),
  });
}

/** 캐릭터 상세(GET /admins/contents/:contentId/characters/:id). */
export function useCharacter(
  contentId: number,
  id: number | null,
): UseQueryResult<AdminCharacter, ApiError> {
  return useQuery<AdminCharacter, ApiError>({
    queryKey: [CHARACTERS_KEY, 'detail', contentId, id],
    queryFn: () => fetchCharacter(contentId, id as number),
    enabled: Number.isFinite(contentId) && id != null,
  });
}

/** 캐릭터 생성(POST /admins/contents/:contentId/characters). 성공 시 목록 무효화. */
export function useCreateCharacter(
  contentId: number,
): UseMutationResult<void, ApiError, CreateCharacterInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateCharacterInput>({
    mutationFn: (input) => createCharacter(contentId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, 'list', contentId] }),
  });
}

/** 캐릭터 수정(PUT /admins/contents/:contentId/characters/:id). 성공 시 목록·상세 무효화. */
export function useUpdateCharacter(
  contentId: number,
): UseMutationResult<void, ApiError, { id: number; input: UpdateCharacterInput }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; input: UpdateCharacterInput }>({
    mutationFn: ({ id, input }) => updateCharacter(contentId, id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY] }),
  });
}
