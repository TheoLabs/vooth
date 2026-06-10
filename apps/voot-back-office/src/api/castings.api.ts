import { CharacterType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/contents/:contentId/castings 응답(캐스팅 = 캐릭터 ↔ 크리에이터 연결). */
export interface CastingListItem {
  id: number;
  characterId: number;
  creatorId: number;
  contentId: number;
  character: {
    id: number;
    name: string;
    type: CharacterType;
    color: string;
  };
  creator: {
    id: number;
    accountId: number;
    account: {
      id: number;
      name: string;
    };
  };
}

/** 콘텐츠의 캐스팅 목록 조회. 보통 수가 적어 한 번에 받는다(limit 100). */
export async function fetchCastings(
  contentId: number,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<CastingListItem>> {
  const response = await apiClient.get<PaginatedResponse<CastingListItem>>(
    `/admins/contents/${contentId}/castings`,
    { params: { page: params.page, limit: params.limit } },
  );
  return response.data;
}

export interface CreateCastingPayload {
  characterId: number;
  creatorId: number;
}

/** 캐스팅 생성(POST /admins/contents/:contentId/castings). 중복이면 "이미 캐스팅된 크리에이터입니다." 에러. */
export async function createCasting(contentId: number, payload: CreateCastingPayload): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/castings`, payload);
}
