import type { CalendarDate, CropBox, EpisodeStatus } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 회차 목록/상세 응답(AdminEpisodeResponseDto). */
export interface AdminEpisode {
  id: number;
  contentId: number;
  title: string;
  thumbnailFileId: number | null;
  thumbnailUrl: string | null;
  thumbnailCropBox: CropBox | null;
  /** 회차 번호 */
  chapter: number;
  expectedPublishOn: CalendarDate | null;
  isFree: boolean;
  status: EpisodeStatus;
}

export interface EpisodeListQuery {
  /** 서버는 title 검색만 허용 */
  searchKey?: 'title';
  searchValue?: string;
  statuses?: EpisodeStatus[];
  isFree?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 회차 목록. GET /admins/contents/:contentId/episodes */
export async function fetchEpisodes(
  contentId: number,
  query: EpisodeListQuery = {},
): Promise<PaginatedResponse<AdminEpisode>> {
  const res = await apiClient.get<PaginatedResponse<AdminEpisode>>(
    `/admins/contents/${contentId}/episodes`,
    { params: query },
  );
  return res.data;
}

/** 회차 상세. GET /admins/contents/:contentId/episodes/:id */
export async function fetchEpisode(contentId: number, id: number): Promise<AdminEpisode> {
  const res = await apiClient.get<AdminEpisode>(
    `/admins/contents/${contentId}/episodes/${id}`,
  );
  return res.data;
}

export interface CreateEpisodeInput {
  title: string;
  chapter: number;
  thumbnailFileId?: number;
  thumbnailCropBox?: CropBox;
}

/** 회차 생성. POST /admins/contents/:contentId/episodes */
export async function createEpisode(
  contentId: number,
  input: CreateEpisodeInput,
): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/episodes`, input);
}

/** 부분 수정: 변경된 필드만 보낸다. (회차 번호 chapter 는 수정 불가) */
export interface UpdateEpisodeInput {
  title?: string;
  thumbnailFileId?: number | null;
  thumbnailCropBox?: CropBox | null;
  isFree?: boolean;
  expectedPublishOn?: CalendarDate | null;
}

/** 회차 수정. PUT /admins/contents/:contentId/episodes/:id */
export async function updateEpisode(
  contentId: number,
  id: number,
  input: UpdateEpisodeInput,
): Promise<void> {
  await apiClient.put(`/admins/contents/${contentId}/episodes/${id}`, input);
}

/** 회차 삭제. DELETE /admins/contents/:contentId/episodes/:id */
export async function deleteEpisode(contentId: number, id: number): Promise<void> {
  await apiClient.delete(`/admins/contents/${contentId}/episodes/${id}`);
}
