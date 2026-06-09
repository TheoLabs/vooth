import { PermissionCategory } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';
import { permissionsMock } from '../mocks/permissions.mock';

/** 권한 단건 모델. (백엔드 Permission 과 1:1 매핑: code/name/category/description) */
export interface PermissionItem {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
}

export interface FetchPermissionsParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  categories?: PermissionCategory[];
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * 전역 권한 카탈로그를 서버 페이지네이션/검색/카테고리 필터로 조회한다.
 *
 * - 빈 searchKey/searchValue 는 쿼리에서 제외한다.
 * - `categories` 는 반복 쿼리 파라미터로 직렬화한다
 *   (예: `?categories=account&categories=role`). 콤마 문자열을 쓰지 않는다.
 *   백엔드 `@ToArray()` 가 반복 파라미터를 배열로 변환하기 때문이다.
 *   선택된 카테고리가 없으면 파라미터 자체를 생략한다.
 */
export async function fetchPermissions(
  params: FetchPermissionsParams,
): Promise<PaginatedResponse<PermissionItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const hasCategories = Boolean(params.categories && params.categories.length > 0);

  const response = await apiClient.get<PaginatedResponse<PermissionItem>>(
    '/admins/permissions',
    {
      params: {
        page: params.page,
        limit: params.limit,
        sort: params.sort || undefined,
        order: params.order || undefined,
        searchKey: hasSearch ? params.searchKey : undefined,
        searchValue: hasSearch ? params.searchValue : undefined,
        // 배열은 인스턴스의 반복 파라미터 직렬화에 위임 (?categories=a&categories=b).
        categories: hasCategories ? params.categories : undefined,
      },
    },
  );

  return response.data;
}

/**
 * 할당 가능한 전체 권한 목록을 조회한다. (역할 권한 트리 선택 등에서 사용)
 *
 * TODO(core-api): 백엔드 권한 API 가 준비되면 아래 목 반환을
 *   `/admins/permissions` 전체 조회로 교체한다.
 */
export async function fetchPermissionCatalog(): Promise<PermissionItem[]> {
  return permissionsMock;
}
