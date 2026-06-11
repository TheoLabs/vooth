import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/contents/:contentId/episodes 응답의 회차 모델. */
export interface EpisodeListItem {
  id: number;
  contentId: number;
  title: string;
  /** 회차 번호. */
  chapter: number;
  /** 회차 상태(서버는 소문자, 예: 'draft'). */
  status: string;
}

/** 콘텐츠의 회차 목록 조회. */
export async function fetchEpisodes(contentId: number): Promise<PaginatedResponse<EpisodeListItem>> {
  const response = await apiClient.get<PaginatedResponse<EpisodeListItem>>(
    `/admins/contents/${contentId}/episodes`,
  );
  return response.data;
}

export interface CreateEpisodePayload {
  title: string;
  chapter: number;
}

/** 회차 생성(POST /admins/contents/:contentId/episodes). */
export async function createEpisode(contentId: number, payload: CreateEpisodePayload): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/episodes`, payload);
}
