import type { RoleType, PermissionCategory } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

export interface RolePermission {
  id: string;
  code: string;
  name: string;
  category: PermissionCategory;
}

export interface Role {
  id: number;
  type: RoleType;
  name: string;
  permissions: RolePermission[];
}

export interface RoleListQuery {
  searchKey?: string;
  searchValue?: string;
  types?: RoleType[];
  page?: number;
  limit?: number;
}

export interface CreateRoleBody {
  name: string;
  type: RoleType;
  permissionCodes: string[];
}

export async function fetchRoles(query: RoleListQuery): Promise<PaginatedResponse<Role>> {
  const response = await apiClient.get<PaginatedResponse<Role>>('/admins/roles', {
    params: query,
  });
  return response.data;
}

export async function fetchRole(id: number): Promise<Role> {
  const response = await apiClient.get<Role>(`/admins/roles/${id}`);
  return response.data;
}

export async function createRole(body: CreateRoleBody): Promise<Role> {
  const response = await apiClient.post<Role>('/admins/roles', body);
  return response.data;
}

/** 권한만 수정 */
export async function updateRolePermissions(
  id: number,
  permissionCodes: string[],
): Promise<Role> {
  const response = await apiClient.put<Role>(`/admins/roles/${id}`, { permissionCodes });
  return response.data;
}
