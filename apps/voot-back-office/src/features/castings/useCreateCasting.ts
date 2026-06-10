import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCasting, type CreateCastingPayload } from '../../api/castings.api';
import { ApiError } from '../../lib/apiClient';

/** 캐스팅 생성. 성공 시 해당 콘텐츠의 캐스팅 목록 무효화. */
export function useCreateCasting() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; payload: CreateCastingPayload }>({
    mutationFn: ({ contentId, payload }) => createCasting(contentId, payload),
    onSuccess: (_data, { contentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['castings', contentId] });
    },
  });
}
