import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEpisode, type CreateEpisodePayload } from '../../api/episodes.api';
import { ApiError } from '../../lib/apiClient';

/** 회차 생성. 성공 시 해당 콘텐츠의 회차 목록 무효화. */
export function useCreateEpisode() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; payload: CreateEpisodePayload }>({
    mutationFn: ({ contentId, payload }) => createEpisode(contentId, payload),
    onSuccess: (_data, { contentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['episodes', contentId] });
    },
  });
}
