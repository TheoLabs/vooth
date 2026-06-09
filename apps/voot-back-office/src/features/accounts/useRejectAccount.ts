import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectAccount } from '../../api/accounts.api';
import { ApiError } from '../../lib/apiClient';

/** 계정 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const ACCOUNTS_QUERY_PREFIX = ['accounts'] as const;

/**
 * 승인 대기 계정을 거절한다(PUT /admins/accounts/:id/reject).
 * 성공 시 계정 목록 쿼리를 무효화해 최신 목록을 다시 불러온다.
 */
export function useRejectAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (id) => rejectAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_PREFIX });
    },
  });
}
