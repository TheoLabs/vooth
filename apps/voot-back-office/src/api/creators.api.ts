import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/creators 응답의 크리에이터(성우) 모델. */
export interface CreatorListItem {
  id: number;
  accountId: number;
  account: {
    id: number;
    name: string;
    email?: string;
  };
}

/** 크리에이터(성우) 목록 조회(GET /admins/creators). 빈 검색 조건은 쿼리에서 제외한다. */
export async function fetchCreators(params: {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
}): Promise<PaginatedResponse<CreatorListItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const response = await apiClient.get<PaginatedResponse<CreatorListItem>>('/admins/creators', {
    params: {
      page: params.page,
      limit: params.limit,
      searchKey: hasSearch ? params.searchKey : undefined,
      searchValue: hasSearch ? params.searchValue : undefined,
    },
  });
  return response.data;
}
