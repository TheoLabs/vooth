import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/**
 * 성우(크리에이터) 목록 응답.
 * 서버 `AdminCreatorResponseDto`. account 는 id/email/name(본명)을 노출한다.
 */
export interface AdminCreator {
  id: number;
  accountId: number;
  /** 활동명 */
  nickname: string;
  avatarFileId: number | null;
  bio: string | null;
  account: { id: number; email: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorListQuery {
  /** 서버는 nickname 검색만 허용한다. */
  searchKey?: 'nickname';
  searchValue?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function fetchCreators(
  query: CreatorListQuery,
): Promise<PaginatedResponse<AdminCreator>> {
  const response = await apiClient.get<PaginatedResponse<AdminCreator>>('/admins/creators', {
    params: query,
  });
  return response.data;
}
