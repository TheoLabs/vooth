import type { AccountStatus, AccountType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/**
 * 계정 응답에 포함되는 역할 요약.
 * 서버 `AccountResponseDto.role` 은 `{ id, name }` 만 노출한다.
 * 역할의 type/permissions 가 필요하면 역할 API(`role.api.ts`)를 사용한다.
 */
export interface AccountRole {
  id: number;
  name: string;
}

export interface Account {
  id: number;
  email: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  roleId: number | null;
  role?: AccountRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountListQuery {
  searchKey?: string;
  searchValue?: string;
  statuses?: AccountStatus[];
  types?: AccountType[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function fetchAccounts(query: AccountListQuery): Promise<PaginatedResponse<Account>> {
  const response = await apiClient.get<PaginatedResponse<Account>>('/admins/accounts', {
    params: query,
  });
  return response.data;
}

/** 승인(활성화) = 역할 부여. 서버 엔드포인트: PUT /admins/accounts/:id/active */
export async function approveAccount(id: number, roleId: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/active`, { roleId });
}

export async function rejectAccount(id: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/reject`);
}

export async function exitAccount(id: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/exit`);
}

/**
 * 역할 변경.
 * 서버 가드: ACTIVE(승인된) 계정만 변경 가능, 본인 계정 변경 불가.
 */
export async function changeAccountRole(id: number, roleId: number): Promise<void> {
  await apiClient.put(`/admins/accounts/${id}/roles`, { roleId });
}
