import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadScript, type UploadScriptPayload } from '../../api/episodes.api';
import { ApiError } from '../../lib/apiClient';

/** 회차 스크립트(컷+대사) 업로드. 성공 시 해당 회차 무효화. */
export function useUploadScript() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; episodeId: number; payload: UploadScriptPayload }>({
    mutationFn: ({ contentId, episodeId, payload }) => uploadScript(contentId, episodeId, payload),
    onSuccess: (_data, { contentId, episodeId }) => {
      void queryClient.invalidateQueries({ queryKey: ['episode', contentId, episodeId] });
    },
  });
}
