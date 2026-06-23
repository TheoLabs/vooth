import type { PermissionCategory } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

export interface Permission {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
}

export interface PermissionListQuery {
  searchKey?: string;
  searchValue?: string;
  categories?: PermissionCategory[];
  page?: number;
  limit?: number;
}

export async function fetchPermissions(
  query: PermissionListQuery,
): Promise<PaginatedResponse<Permission>> {
  const response = await apiClient.get<PaginatedResponse<Permission>>('/admins/permissions', {
    params: query,
  });
  return response.data;
}
