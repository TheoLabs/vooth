import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRole,
  fetchRoles,
  updateRolePermissions,
  type CreateRoleBody,
  type Role,
  type RoleListQuery,
} from '../../api/role.api';
import type { PaginatedResponse } from '../../api/pagination';
import { ApiError } from '../../lib/apiClient';

const ROLES_KEY = 'roles';

export function useRoles(query: RoleListQuery) {
  return useQuery<PaginatedResponse<Role>, ApiError>({
    queryKey: [ROLES_KEY, query],
    queryFn: () => fetchRoles(query),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<Role, ApiError, CreateRoleBody>({
    mutationFn: (body) => createRole(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation<Role, ApiError, { id: number; permissionCodes: string[] }>({
    mutationFn: ({ id, permissionCodes }) => updateRolePermissions(id, permissionCodes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}
