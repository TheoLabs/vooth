import { TagColor } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/tags 응답의 태그 모델. */
export interface TagListItem {
  id: number;
  name: string;
  color: TagColor;
  usageCount: number;
}

export interface FetchTagsParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  /** 단일 정렬 필드(예: name, usageCount). 멀티 정렬은 지원하지 않는다. */
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/** 태그 목록 조회(GET /admins/tags). 빈 검색/정렬 조건은 쿼리에서 제외한다. */
export async function fetchTags(params: FetchTagsParams): Promise<PaginatedResponse<TagListItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const response = await apiClient.get<PaginatedResponse<TagListItem>>('/admins/tags', {
    params: {
      page: params.page,
      limit: params.limit,
      searchKey: hasSearch ? params.searchKey : undefined,
      searchValue: hasSearch ? params.searchValue : undefined,
      sort: params.sort || undefined,
      order: params.order || undefined,
    },
  });
  return response.data;
}

export interface CreateTagPayload {
  name: string;
  color: TagColor;
}

/** 태그 생성(POST /admins/tags). 중복 이름이면 "이미 등록된 태그입니다." 에러. */
export async function createTag(payload: CreateTagPayload): Promise<void> {
  await apiClient.post('/admins/tags', payload);
}

export interface UpdateTagPayload {
  name?: string;
  color?: TagColor;
}

/** 태그 수정(PUT /admins/tags/:id). */
export async function updateTag(id: number, payload: UpdateTagPayload): Promise<void> {
  await apiClient.put(`/admins/tags/${id}`, payload);
}

/**
 * 태그 삭제(DELETE /admins/tags/:id).
 * 하드 삭제 + content_tag FK CASCADE 로 연결된 콘텐츠의 태그 연결이 함께 제거된다.
 */
export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`/admins/tags/${id}`);
}
