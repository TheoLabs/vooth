import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCharacter, type CreateCharacterPayload } from '../../api/characters.api';
import { ApiError } from '../../lib/apiClient';

/** 등장인물 생성. 성공 시 해당 콘텐츠의 등장인물 목록 무효화. */
export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { contentId: number; payload: CreateCharacterPayload }>({
    mutationFn: ({ contentId, payload }) => createCharacter(contentId, payload),
    onSuccess: (_data, { contentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['characters', contentId] });
    },
  });
}
