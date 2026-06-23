import { useQuery } from '@tanstack/react-query';
import {
  fetchPermissions,
  type Permission,
  type PermissionListQuery,
} from '../../api/permission.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

const PERMISSIONS_KEY = 'permissions';

export function usePermissions(query: PermissionListQuery) {
  return useQuery<PaginatedResponse<Permission>, ApiError>({
    queryKey: [PERMISSIONS_KEY, query],
    queryFn: () => fetchPermissions(query),
    placeholderData: (prev) => prev,
  });
}

/** 역할 권한 선택 UI 용: 전체 권한 목록(큰 limit). */
export function useAllPermissions(enabled = true) {
  return useQuery<PaginatedResponse<Permission>, ApiError>({
    queryKey: [PERMISSIONS_KEY, 'all'],
    queryFn: () => fetchPermissions({ page: 1, limit: 1000 }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
