import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createContent,
  fetchContents,
  type AdminContent,
  type ContentListQuery,
  type CreateContentInput,
} from '../../api/content.api';
import type { PaginatedResponse } from '../../api/pagination';
import type { ApiError } from '../../lib/apiClient';

export const CONTENTS_KEY = 'contents';

/** 작품 목록(GET /admins/contents). */
export function useContents(
  query: ContentListQuery,
): UseQueryResult<PaginatedResponse<AdminContent>, ApiError> {
  return useQuery<PaginatedResponse<AdminContent>, ApiError>({
    queryKey: [CONTENTS_KEY, query],
    queryFn: () => fetchContents(query),
    placeholderData: (prev) => prev,
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
