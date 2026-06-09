import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exitAccount } from '../../api/accounts.api';
import { ApiError } from '../../lib/apiClient';

/** 계정 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const ACCOUNTS_QUERY_PREFIX = ['accounts'] as const;

/**
 * 활성 계정을 퇴사 처리한다(PUT /admins/accounts/:id/exit).
 * 성공 시 계정 목록 쿼리를 무효화해 최신 목록을 다시 불러온다.
 */
export function useExitAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (id) => exitAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_PREFIX });
    },
  });
}
