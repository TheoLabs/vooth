import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 태그 목록 응답(AdminTagResponseDto). */
export interface AdminTag {
  id: number;
  name: string;
  /** hex 색상(#RRGGBB) */
  color: string;
  /** 연결된 활성 콘텐츠 수(파생) */
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagListQuery {
  /** 서버는 name 검색만 허용한다. */
  searchKey?: 'name';
  searchValue?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 태그 목록. GET /admins/tags */
export async function fetchTags(query: TagListQuery): Promise<PaginatedResponse<AdminTag>> {
  const response = await apiClient.get<PaginatedResponse<AdminTag>>('/admins/tags', {
    params: query,
  });
  return response.data;
}

export interface CreateTagInput {
  name: string;
  /** hex 색상(#RRGGBB) */
  color: string;
}

/** 태그 생성. POST /admins/tags */
export async function createTag(input: CreateTagInput): Promise<void> {
  await apiClient.post('/admins/tags', input);
}

/** 부분 수정: 변경된 필드만 보낸다. */
export interface UpdateTagInput {
  name?: string;
  color?: string;
}

/** 태그 수정. PUT /admins/tags/:id */
export async function updateTag(id: number, input: UpdateTagInput): Promise<void> {
  await apiClient.put(`/admins/tags/${id}`, input);
}

/** 태그 삭제. DELETE /admins/tags/:id */
export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`/admins/tags/${id}`);
}
