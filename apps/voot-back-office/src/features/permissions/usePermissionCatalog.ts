import { useQuery } from '@tanstack/react-query';
import {
  fetchPermissionCatalog,
  type PermissionItem,
} from '../../api/permissions.api';
import { ApiError } from '../../lib/apiClient';

export const permissionCatalogQueryKey = ['permission-catalog'] as const;

/**
 * 할당 가능한 전체 권한 목록을 조회한다.
 * 카탈로그는 거의 변하지 않으므로 staleTime 을 길게 둔다.
 */
export function usePermissionCatalog() {
  return useQuery<PermissionItem[], ApiError>({
    queryKey: permissionCatalogQueryKey,
    queryFn: fetchPermissionCatalog,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
