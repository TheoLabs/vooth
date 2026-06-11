import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEpisode, type UpdateEpisodePayload } from '../../api/episodes.api';
import { ApiError } from '../../lib/apiClient';

/** 회차 수정. 성공 시 해당 회차 상세 + 콘텐츠 회차 목록 무효화. */
export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; episodeId: number; payload: UpdateEpisodePayload }>({
    mutationFn: ({ contentId, episodeId, payload }) => updateEpisode(contentId, episodeId, payload),
    onSuccess: (_data, { contentId, episodeId }) => {
      void queryClient.invalidateQueries({ queryKey: ['episode', contentId, episodeId] });
      void queryClient.invalidateQueries({ queryKey: ['episodes', contentId] });
    },
  });
}
