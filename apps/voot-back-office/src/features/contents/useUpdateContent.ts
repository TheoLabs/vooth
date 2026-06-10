import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateContent, type UpdateContentPayload } from '../../api/contents.api';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 수정(PUT /admins/contents/:id). 성공 시 상세/목록 쿼리 무효화. */
export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; payload: UpdateContentPayload }>({
    mutationFn: ({ id, payload }) => updateContent(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}
