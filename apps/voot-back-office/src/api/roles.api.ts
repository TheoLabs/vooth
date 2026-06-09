import { RoleType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 역할에 부여된 권한(전체 객체). */
export interface RolePermission {
  code: string;
  name: string;
  category: string;
  description: string;
}

/**
 * GET /admins/roles 응답의 역할 모델.
 * 목록 응답에 부여된 권한(permissions) 전체 객체가 포함된다.
 */
export interface RoleListItem {
  id: number;
  type: RoleType;
  name: string;
  permissions: RolePermission[];
}

export interface FetchRolesParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  /** 역할 유형 필터(다중). 빈 배열은 쿼리에서 제외한다. */
  types?: RoleType[];
}

/**
 * 관리자 역할 목록을 서버 페이지네이션/검색으로 조회한다.
 * 빈 searchKey/searchValue 는 쿼리에서 제외한다.
 */
export async function fetchRoles(
  params: FetchRolesParams,
): Promise<PaginatedResponse<RoleListItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const hasTypes = Boolean(params.types && params.types.length > 0);

  const response = await apiClient.get<PaginatedResponse<RoleListItem>>(
    '/admins/roles',
    {
      // 배열(types)은 apiClient 의 paramsSerializer 가 반복 쿼리로 직렬화한다.
      params: {
        page: params.page,
        limit: params.limit,
        sort: params.sort || undefined,
        order: params.order || undefined,
        searchKey: hasSearch ? params.searchKey : undefined,
        searchValue: hasSearch ? params.searchValue : undefined,
        types: hasTypes ? params.types : undefined,
      },
    },
  );

  return response.data;
}

/** POST /admins/roles 요청 본문 (RoleCreateDto 와 1:1). */
export interface CreateRolePayload {
  type: RoleType;
  name: string;
  permissionCodes: string[];
}

/** 역할을 생성한다. */
export async function createRole(payload: CreateRolePayload): Promise<void> {
  await apiClient.post('/admins/roles', payload);
}

/**
 * PUT /admins/roles/:id 요청 본문.
 * 수정 API 는 권한(permissionCodes)만 재할당한다. name/type 은 변경하지 않는다.
 */
export interface UpdateRolePayload {
  permissionCodes: string[];
}

/**
 * 역할의 권한을 수정한다(PUT /admins/roles/:id).
 * 성공 응답은 빈 객체이며 apiClient 가 언랩한다.
 * 실패 시 ApiError.message 로 "존재하지 않는 역할입니다." 등이 전달된다.
 */
export async function updateRole(
  id: number,
  payload: UpdateRolePayload,
): Promise<void> {
  await apiClient.put(`/admins/roles/${id}`, payload);
}
