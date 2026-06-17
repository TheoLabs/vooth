import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createContent,
  deleteContent,
  fetchContent,
  fetchContents,
  updateContent,
  type AdminContent,
  type ContentListQuery,
  type CreateContentInput,
  type UpdateContentInput,
} from '../../api/content.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const CONTENTS_KEY = 'contents';

/** 작품 목록(GET /admins/contents). */
export function useContents(
  query: ContentListQuery,
): UseQueryResult<PaginatedResponse<AdminContent>, ApiError> {
  return useQuery<PaginatedResponse<AdminContent>, ApiError>({
    queryKey: [CONTENTS_KEY, 'list', query],
    queryFn: () => fetchContents(query),
    placeholderData: (prev) => prev,
  });
}

/** 작품 상세(GET /admins/contents/:id). */
export function useContent(id: number): UseQueryResult<AdminContent, ApiError> {
  return useQuery<AdminContent, ApiError>({
    queryKey: [CONTENTS_KEY, 'detail', id],
    queryFn: () => fetchContent(id),
    enabled: Number.isFinite(id),
  });
}

/** 작품 생성(POST /admins/contents). 성공 시 목록 무효화. */
export function useCreateContent(): UseMutationResult<void, ApiError, CreateContentInput> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateContentInput>({
    mutationFn: createContent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CONTENTS_KEY] }),
  });
}

/** 작품 수정(PUT /admins/contents/:id). 성공 시 목록·상세 무효화. */
export function useUpdateContent(): UseMutationResult<
  void,
  ApiError,
  { id: number; input: UpdateContentInput }
> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; input: UpdateContentInput }>({
    mutationFn: ({ id, input }) => updateContent(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CONTENTS_KEY] }),
  });
}

/** 작품 삭제(DELETE /admins/contents/:id). 성공 시 목록 무효화. */
export function useDeleteContent(): UseMutationResult<void, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: deleteContent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CONTENTS_KEY] }),
  });
}
