import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContentStatus } from '@vooth/shared';
import { updateContentStatus } from '../../api/contents.api';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 상태 변경(PUT /admins/contents/:id/status). 성공 시 상세/목록 무효화. */
export function useUpdateContentStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; status: ContentStatus }>({
    mutationFn: ({ id, status }) => updateContentStatus(id, status),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}
