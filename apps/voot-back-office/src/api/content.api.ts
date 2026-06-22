import type { CalendarDate, ContentStatus, CropBox } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 콘텐츠 응답의 태그(id/name/color). */
export interface ContentTagRef {
  id: number;
  name: string;
  color: string;
}

/** 작품 목록 응답(AdminContentResponseDto). */
export interface AdminContent {
  id: number;
  thumbnailFileId: number;
  thumbnailCropBox: CropBox;
  title: string;
  description: string;
  status: ContentStatus;
  /** 표시용 썸네일 public URL (없으면 null) */
  thumbnailUrl: string | null;
  expectedPublishOn: CalendarDate | null;
  /** 회차(에피소드) 수 */
  episodeCount: number;
  tags: ContentTagRef[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentListQuery {
  /** 서버는 title 검색만 허용 */
  searchKey?: 'title';
  searchValue?: string;
  statuses?: ContentStatus[];
  tagIds?: number[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 작품 목록. GET /admins/contents */
export async function fetchContents(
  query: ContentListQuery,
): Promise<PaginatedResponse<AdminContent>> {
  const response = await apiClient.get<PaginatedResponse<AdminContent>>('/admins/contents', {
    params: query,
  });
  return response.data;
}

export interface CreateContentInput {
  thumbnailFileId: number;
  /** 정규화 크롭 영역(0~1) */
  thumbnailCropBox: CropBox;
  title: string;
  description: string;
  tagIds: number[];
}

/** 작품 생성. POST /admins/contents */
export async function createContent(input: CreateContentInput): Promise<void> {
  await apiClient.post('/admins/contents', input);
}

/** 작품 상세. GET /admins/contents/:id */
export async function fetchContent(id: number): Promise<AdminContent> {
  const res = await apiClient.get<AdminContent>(`/admins/contents/${id}`);
  return res.data;
}

/** 부분 수정: 변경된 필드만 보낸다. */
export interface UpdateContentInput {
  title?: string;
  description?: string;
  thumbnailFileId?: number;
  thumbnailCropBox?: CropBox;
  tagIds?: number[];
}

/** 작품 수정. PUT /admins/contents/:id */
export async function updateContent(id: number, input: UpdateContentInput): Promise<void> {
  await apiClient.put(`/admins/contents/${id}`, input);
}

/** 작품 삭제. DELETE /admins/contents/:id */
export async function deleteContent(id: number): Promise<void> {
  await apiClient.delete(`/admins/contents/${id}`);
}

/** 작품 상태 변경. PUT /admins/contents/:id/status */
export async function updateContentStatus(id: number, nextStatus: ContentStatus): Promise<void> {
  await apiClient.put(`/admins/contents/${id}/status`, { nextStatus });
}
