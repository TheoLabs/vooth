import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createTag,
  deleteTag,
  fetchTags,
  updateTag,
  type AdminTag,
  type CreateTagInput,
  type TagListQuery,
  type UpdateTagInput,
} from '../../api/tag.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const TAGS_KEY = 'tags';

/** 태그 목록(GET /admins/tags). */
export function useTags(
  query: TagListQuery,
): UseQueryResult<PaginatedResponse<AdminTag>, ApiError> {
  return useQuery<PaginatedResponse<AdminTag>, ApiError>({
    queryKey: [TAGS_KEY, query],
    queryFn: () => fetchTags(query),
    placeholderData: (prev) => prev,
  });
}

/** 태그 생성(POST /admins/tags). 성공 시 목록 무효화로 최신화. */
export function useCreateTag(): UseMutationResult<void, ApiError, CreateTagInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateTagInput>({
    mutationFn: createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TAGS_KEY] }),
  });
}

/** 태그 수정(PUT /admins/tags/:id). 변경된 필드만 전달. */
export function useUpdateTag(): UseMutationResult<
  void,
  ApiError,
  { id: number; input: UpdateTagInput }
> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; input: UpdateTagInput }>({
    mutationFn: ({ id, input }) => updateTag(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TAGS_KEY] }),
  });
}

/** 태그 삭제(DELETE /admins/tags/:id). */
export function useDeleteTag(): UseMutationResult<void, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TAGS_KEY] }),
  });
}
