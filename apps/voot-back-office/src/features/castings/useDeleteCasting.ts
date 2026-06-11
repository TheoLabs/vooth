import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCasting } from '../../api/castings.api';
import { ApiError } from '../../lib/apiClient';

/** 캐스팅 삭제. 성공 시 해당 콘텐츠의 캐스팅 목록 무효화. */
export function useDeleteCasting() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; castingId: number }>({
    mutationFn: ({ contentId, castingId }) => deleteCasting(contentId, castingId),
    onSuccess: (_data, { contentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['castings', contentId] });
    },
  });
}
