import { apiRequest } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/**
 * GET /admins/roles 응답의 역할 모델.
 * 백엔드 Role 엔티티는 code/description/권한 수를 반환하지 않는다.
 */
export interface RoleListItem {
  id: number;
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
