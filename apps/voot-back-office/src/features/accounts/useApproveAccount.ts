import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveAccount,
  type ApproveAccountPayload,
} from '../../api/accounts.api';
import { ApiError } from '../../lib/apiClient';

/** 계정 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const ACCOUNTS_QUERY_PREFIX = ['accounts'] as const;

/** useApproveAccount 의 mutate 인자: 대상 계정 id + 승인 본문. */
export interface ApproveAccountVariables {
  id: number;
  payload: ApproveAccountPayload;
}

/**
 * 승인 대기 계정을 승인한다(PUT /admins/accounts/:id/approve).
 * 성공 시 계정 목록 쿼리를 무효화해 최신 목록을 다시 불러온다.
 */
export function useApproveAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ApproveAccountVariables>({
    mutationFn: ({ id, payload }) => approveAccount(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_PREFIX });
    },
  });
}
