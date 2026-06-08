import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createRole,
  fetchRoles,
  type CreateRolePayload,
  type FetchRolesParams,
  type RoleListItem,
} from '../../api/roles.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

export const rolesQueryKey = (params: FetchRolesParams) =>
  ['roles', params] as const;

/** 역할 목록 쿼리 전체를 무효화할 때 쓰는 prefix. */
const ROLES_QUERY_PREFIX = ['roles'] as const;

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

/**
 * 역할을 생성한다(POST /admins/roles).
 * 성공 시 역할 목록 쿼리를 무효화해 최신 목록을 다시 불러온다.
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, CreateRolePayload>({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_PREFIX });
    },
  });
}
