import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTag,
  deleteTag,
  updateTag,
  type CreateTagPayload,
  type UpdateTagPayload,
} from '../../api/tags.api';
import { ApiError } from '../../lib/apiClient';

/** 태그 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const TAGS_QUERY_PREFIX = ['tags'] as const;

/** 태그 생성(POST /admins/tags). 성공 시 목록 무효화. */
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateTagPayload>({
    mutationFn: (payload) => createTag(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_QUERY_PREFIX });
    },
  });
}

/** 태그 수정(PUT /admins/tags/:id). 성공 시 목록 무효화. */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; payload: UpdateTagPayload }>({
    mutationFn: ({ id, payload }) => updateTag(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_QUERY_PREFIX });
    },
  });
}

/** 태그 삭제(DELETE /admins/tags/:id). 성공 시 목록 무효화. */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => deleteTag(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_QUERY_PREFIX });
    },
  });
}
