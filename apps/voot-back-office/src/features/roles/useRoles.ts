import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchRoles,
  type FetchRolesParams,
  type RoleListItem,
} from '../../api/roles.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const rolesQueryKey = (params: FetchRolesParams) =>
  ['roles', params] as const;

/**
 * 관리자 역할 목록(GET /admins/roles)을 조회한다.
 * 페이지/검색 전환 시 깜빡임이 없도록 이전 데이터를 유지한다.
 * 4xx 는 재시도하지 않는다.
 */
export function useRoles(params: FetchRolesParams) {
  return useQuery<PaginatedResponse<RoleListItem>, ApiError>({
    queryKey: rolesQueryKey(params),
    queryFn: () => fetchRoles(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
