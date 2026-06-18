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
