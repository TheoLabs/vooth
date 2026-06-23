import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 캐스팅 응답의 성우(creator) 요약. */
export interface CastingCreator {
  id: number;
  accountId: number;
  nickname: string;
  avatarFileId: number | null;
  avatarUrl: string | null;
}

/** 캐스팅(캐릭터 ↔ 성우). AdminCastingResponseDto. */
export interface AdminCasting {
  id: number;
  characterId: number;
  creatorId: number;
  contentId: number;
  isPublished: boolean;
  creator: CastingCreator;
}

export interface CastingListQuery {
  page?: number;
  limit?: number;
}

/** 캐릭터의 캐스팅 목록. GET /admins/characters/:characterId/castings */
export async function fetchCastings(
  characterId: number,
  query: CastingListQuery = {},
): Promise<PaginatedResponse<AdminCasting>> {
  const res = await apiClient.get<PaginatedResponse<AdminCasting>>(
    `/admins/characters/${characterId}/castings`,
    { params: query },
  );
  return res.data;
}

export interface CreateCastingInput {
  contentId: number;
  creatorId: number;
}

/** 캐스팅 생성. POST /admins/characters/:characterId/castings */
export async function createCasting(
  characterId: number,
  input: CreateCastingInput,
): Promise<void> {
  await apiClient.post(`/admins/characters/${characterId}/castings`, input);
}

/** 캐스팅 공개/비공개 변경. PUT /admins/characters/:characterId/castings/:castingId/publish */
export async function changeCastingPublish(
  characterId: number,
  castingId: number,
  isPublished: boolean,
): Promise<void> {
  await apiClient.put(`/admins/characters/${characterId}/castings/${castingId}/publish`, {
    isPublished,
  });
}

/** 캐스팅 해제. DELETE /admins/characters/:characterId/castings/:castingId */
export async function deleteCasting(characterId: number, castingId: number): Promise<void> {
  await apiClient.delete(`/admins/characters/${characterId}/castings/${castingId}`);
}
