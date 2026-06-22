import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createCut,
  deleteCut,
  fetchCuts,
  type AdminCut,
  type CreateCutInput,
} from '../../api/cut.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const CUTS_KEY = 'cuts';

/** 회차의 컷 목록(GET /admins/cuts?episodeId=). */
export function useCuts(
  episodeId: number,
): UseQueryResult<PaginatedResponse<AdminCut>, ApiError> {
  return useQuery<PaginatedResponse<AdminCut>, ApiError>({
    queryKey: [CUTS_KEY, 'list', episodeId],
    queryFn: () => fetchCuts(episodeId),
    enabled: Number.isFinite(episodeId),
  });
}

/** 컷 생성(POST). 성공 시 해당 회차 컷 목록 무효화. */
export function useCreateCut(
  episodeId: number,
): UseMutationResult<void, ApiError, CreateCutInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateCutInput>({
    mutationFn: (input) => createCut(episodeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', episodeId] }),
  });
}

/** 컷 삭제(DELETE). 성공 시 해당 회차 컷 목록 무효화. */
export function useDeleteCut(
  episodeId: number,
): UseMutationResult<void, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (cutId) => deleteCut(episodeId, cutId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', episodeId] }),
  });
}
