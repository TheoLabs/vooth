import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchPermissions,
  type FetchPermissionsParams,
  type PermissionItem,
} from '../../api/permissions.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const permissionsQueryKey = (params: FetchPermissionsParams) =>
  ['permissions', params] as const;

/** usePermissions 의 선택 옵션. 조건부 조회(enabled) 등을 전달한다. */
export interface UsePermissionsOptions {
  enabled?: boolean;
}

/**
 * 전역 권한 카탈로그(GET /admins/permissions)를 조회한다.
 * 페이지/검색/필터 전환 시 깜빡임이 없도록 이전 데이터를 유지한다.
 * 4xx 는 재시도하지 않는다.
 */
export function usePermissions(
  params: FetchPermissionsParams,
  options?: UsePermissionsOptions,
) {
  return useQuery<PaginatedResponse<PermissionItem>, ApiError>({
    queryKey: permissionsQueryKey(params),
    queryFn: () => fetchPermissions(params),
    placeholderData: keepPreviousData,
    retry: false,
    enabled: options?.enabled,
  });
}
