import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveAccount,
  changeAccountRole,
  exitAccount,
  fetchAccounts,
  rejectAccount,
  type Account,
  type AccountListQuery,
} from '../../api/account.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

const ACCOUNTS_KEY = 'accounts';

export function useAccounts(query: AccountListQuery) {
  return useQuery<PaginatedResponse<Account>, ApiError>({
    queryKey: [ACCOUNTS_KEY, query],
    queryFn: () => fetchAccounts(query),
    placeholderData: (prev) => prev,
  });
}

export function useApproveAccount() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; roleId: number }>({
    mutationFn: ({ id, roleId }) => approveAccount(id, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] }),
  });
}

export function useRejectAccount() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => rejectAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] }),
  });
}

export function useExitAccount() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => exitAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] }),
  });
}

export function useChangeAccountRole() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: number; roleId: number }>({
    mutationFn: ({ id, roleId }) => changeAccountRole(id, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] }),
  });
}
