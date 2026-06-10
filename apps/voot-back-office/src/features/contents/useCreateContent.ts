import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContent, type CreateContentPayload } from '../../api/contents.api';
import { ApiError } from '../../lib/apiClient';

/** 콘텐츠 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const CONTENTS_QUERY_PREFIX = ['contents'] as const;

/** 콘텐츠 등록(POST /admins/contents). 성공 시 목록 무효화. */
export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, CreateContentPayload>({
    mutationFn: (payload) => createContent(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONTENTS_QUERY_PREFIX });
    },
  });
}
