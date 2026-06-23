import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createEpisode,
  deleteEpisode,
  fetchEpisode,
  fetchEpisodes,
  updateEpisode,
  type AdminEpisode,
  type CreateEpisodeInput,
  type EpisodeListQuery,
  type UpdateEpisodeInput,
} from '../../api/episode.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const EPISODES_KEY = 'episodes';

/** 회차 목록(GET /admins/contents/:contentId/episodes). */
export function useEpisodes(
  contentId: number,
  query: EpisodeListQuery = {},
): UseQueryResult<PaginatedResponse<AdminEpisode>, ApiError> {
  return useQuery<PaginatedResponse<AdminEpisode>, ApiError>({
    queryKey: [EPISODES_KEY, 'list', contentId, query],
    queryFn: () => fetchEpisodes(contentId, query),
    enabled: Number.isFinite(contentId),
    placeholderData: (prev) => prev,
  });
}

/** 회차 상세(GET /admins/contents/:contentId/episodes/:id). */
export function useEpisode(
  contentId: number,
  id: number | null,
): UseQueryResult<AdminEpisode, ApiError> {
  return useQuery<AdminEpisode, ApiError>({
    queryKey: [EPISODES_KEY, 'detail', contentId, id],
    queryFn: () => fetchEpisode(contentId, id as number),
    enabled: Number.isFinite(contentId) && id != null,
  });
}

/** 회차 생성(POST /admins/contents/:contentId/episodes). 성공 시 목록 무효화. */
export function useCreateEpisode(
  contentId: number,
): UseMutationResult<void, ApiError, CreateEpisodeInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateEpisodeInput>({
    mutationFn: (input) => createEpisode(contentId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, 'list', contentId] }),
  });
}

/** 회차 수정(PUT /admins/contents/:contentId/episodes/:id). 성공 시 목록·상세 무효화. */
export function useUpdateEpisode(
  contentId: number,
): UseMutationResult<void, ApiError, { id: number; input: UpdateEpisodeInput }> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; input: UpdateEpisodeInput }>({
    mutationFn: ({ id, input }) => updateEpisode(contentId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EPISODES_KEY] }),
  });
}

/** 회차 삭제(DELETE /admins/contents/:contentId/episodes/:id). 성공 시 목록 무효화. */
export function useDeleteEpisode(
  contentId: number,
): UseMutationResult<void, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => deleteEpisode(contentId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, 'list', contentId] }),
  });
}
