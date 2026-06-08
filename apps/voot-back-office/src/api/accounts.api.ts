import { AccountType } from '@vooth/shared';
import { apiRequest } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 계정 상태 (백엔드 status 와 1:1 매핑) */
export type AccountStatus = 'pending' | 'active' | 'exited';

/**
 * GET /admins/accounts 응답의 계정 모델.
 */
export interface AccountListItem {
  id: number;
  email: string;
  name: string;
  type: AccountType;
  roleId: number | null;
  status: AccountStatus;
  googleSub: string;
  createdAt: string;
  updatedAt: string;
}

export interface FetchAccountsParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * 관리자 계정 목록을 서버 페이지네이션/검색으로 조회한다.
 * 빈 searchKey/searchValue 는 쿼리에서 제외한다.
 */
export async function fetchAccounts(
  params: FetchAccountsParams,
): Promise<PaginatedResponse<AccountListItem>> {
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

  return apiRequest<PaginatedResponse<AccountListItem>>(
    `/admins/accounts?${query.toString()}`,
  );
}
