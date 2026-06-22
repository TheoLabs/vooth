import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createCut,
  createLine,
  deleteCut,
  deleteLine,
  fetchCuts,
  updateCut,
  updateLine,
  type AdminCut,
  type CreateCutInput,
  type CreateLineInput,
  type UpdateCutInput,
  type UpdateLineInput,
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

/** 컷 수정(PUT, 부분). 성공 시 해당 회차 컷 목록 무효화. */
export function useUpdateCut(
  episodeId: number,
): UseMutationResult<void, ApiError, { cutId: number; input: UpdateCutInput }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { cutId: number; input: UpdateCutInput }>({
    mutationFn: ({ cutId, input }) => updateCut(episodeId, cutId, input),
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

/** 대사(라인) 등록(POST .../lines). 컷 목록에 lines 가 조인되므로 목록을 무효화한다. */
export function useCreateLine(
  episodeId: number,
): UseMutationResult<void, ApiError, { cutId: number; input: CreateLineInput }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { cutId: number; input: CreateLineInput }>({
    mutationFn: ({ cutId, input }) => createLine(cutId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', episodeId] }),
  });
}

/** 대사(라인) 수정(PUT .../lines/:lineId). 성공 시 컷 목록 무효화. */
export function useUpdateLine(
  episodeId: number,
): UseMutationResult<void, ApiError, { cutId: number; lineId: number; input: UpdateLineInput }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { cutId: number; lineId: number; input: UpdateLineInput }>({
    mutationFn: ({ cutId, lineId, input }) => updateLine(cutId, lineId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', episodeId] }),
  });
}

/** 대사(라인) 삭제(DELETE .../lines/:lineId). 성공 시 컷 목록 무효화. */
export function useDeleteLine(
  episodeId: number,
): UseMutationResult<void, ApiError, { cutId: number; lineId: number }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { cutId: number; lineId: number }>({
    mutationFn: ({ cutId, lineId }) => deleteLine(cutId, lineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CUTS_KEY, 'list', episodeId] }),
  });
}
