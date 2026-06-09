import { AccountStatus as AccountStatusEnum, AccountType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 계정 상태 (백엔드 status 와 1:1 매핑) */
export type AccountStatus = 'pending' | 'rejected' | 'active' | 'exited';

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
  statuses?: AccountStatusEnum[];
  types?: AccountType[];
}

/**
 * 관리자 계정 목록을 서버 페이지네이션/검색으로 조회한다.
 * 빈 searchKey/searchValue 는 쿼리에서 제외한다.
 */
export async function fetchAccounts(
  params: FetchAccountsParams,
): Promise<PaginatedResponse<AccountListItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const hasStatuses = Boolean(params.statuses && params.statuses.length > 0);
  const hasTypes = Boolean(params.types && params.types.length > 0);

  const response = await apiClient.get<PaginatedResponse<AccountListItem>>(
    '/admins/accounts',
    {
      params: {
        page: params.page,
        limit: params.limit,
        sort: params.sort || undefined,
        order: params.order || undefined,
        searchKey: hasSearch ? params.searchKey : undefined,
        searchValue: hasSearch ? params.searchValue : undefined,
        statuses: hasStatuses ? params.statuses : undefined,
        types: hasTypes ? params.types : undefined,
      },
    },
  );

  return response.data;
}

/** PUT /admins/accounts/:id/approve 요청 본문. */
export interface ApproveAccountPayload {
  roleId: number;
}

/**
 * 승인 대기 계정을 승인한다(PUT /admins/accounts/:id/approve).
 * 계정을 ACTIVE 로 전환하고 지정한 역할을 부여한다.
 * 성공 응답은 빈 객체이며 apiClient 가 언랩한다.
 * 실패 시 ApiError.message 로 "존재하지 않는 계정입니다." /
 * "존재하지 않는 역할입니다." 등이 전달된다.
 */
export async function approveAccount(
  id: number,
  payload: ApproveAccountPayload,
): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/approve`, payload);
}

/**
 * 승인 대기 계정을 거절한다(PUT /admins/accounts/:id/reject).
 * 본문 없이 호출하며 계정을 REJECTED 로 전환한다. PENDING 상태에서만 유효하다.
 * 성공 응답은 빈 객체이며 apiClient 가 언랩한다.
 * 실패 시 ApiError.message 로 "존재하지 않는 계정입니다." 등 상태 오류가 전달된다.
 */
export async function rejectAccount(id: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/reject`);
}

/**
 * 활성 계정을 퇴사 처리한다(PUT /admins/accounts/:id/exit).
 * 본문 없이 호출하며 계정을 EXITED 로 전환하고 역할을 해제한다. ACTIVE 상태에서만 유효하다.
 * 성공 응답은 빈 객체이며 apiClient 가 언랩한다.
 * 실패 시 ApiError.message 로 상태 오류가 전달된다.
 */
export async function exitAccount(id: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/exit`);
}
