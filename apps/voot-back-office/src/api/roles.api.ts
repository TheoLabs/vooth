import { RoleType } from '@vooth/shared';
import { apiRequest } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/**
 * GET /admins/roles 응답의 역할 모델.
 * 목록 응답에는 권한(permissions) 관계가 포함되지 않는다.
 */
export interface RoleListItem {
  id: number;
  type: RoleType;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchRolesParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * 관리자 역할 목록을 서버 페이지네이션/검색으로 조회한다.
 * 빈 searchKey/searchValue 는 쿼리에서 제외한다.
 */
export async function fetchRoles(
  params: FetchRolesParams,
): Promise<PaginatedResponse<RoleListItem>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('limit', String(params.limit));

  if (params.sort) {
    query.set('sort', params.sort);
  }
  if (params.order) {
    query.set('order', params.order);
  }
  if (params.searchKey && params.searchValue) {
    query.set('searchKey', params.searchKey);
    query.set('searchValue', params.searchValue);
  }

  return apiRequest<PaginatedResponse<RoleListItem>>(
    `/admins/roles?${query.toString()}`,
  );
}

/** POST /admins/roles 요청 본문 (RoleCreateDto 와 1:1). */
export interface CreateRolePayload {
  type: RoleType;
  name: string;
  permissionCodes: string[];
}

/** 역할을 생성한다. */
export async function createRole(payload: CreateRolePayload): Promise<void> {
  await apiRequest('/admins/roles', { method: 'POST', body: payload });
}
