import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchAccounts,
  type AccountListItem,
  type FetchAccountsParams,
} from '../../api/accounts.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const accountsQueryKey = (params: FetchAccountsParams) =>
  ['accounts', params] as const;

/**
 * 관리자 계정 목록(GET /admins/accounts)을 조회한다.
 * 페이지/검색 전환 시 깜빡임이 없도록 이전 데이터를 유지한다.
 * 4xx 는 재시도하지 않는다.
 */
export function useAccounts(params: FetchAccountsParams) {
  return useQuery<PaginatedResponse<AccountListItem>, ApiError>({
    queryKey: accountsQueryKey(params),
    queryFn: () => fetchAccounts(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
