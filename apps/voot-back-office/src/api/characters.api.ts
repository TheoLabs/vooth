import { CharacterType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/contents/:contentId/characters 응답의 등장인물 모델. */
export interface CharacterListItem {
  id: number;
  contentId: number;
  name: string;
  type: CharacterType;
  color: string;
  createdAt: string;
  updatedAt: string;
}

/** CharacterType 표시 메타. */
export const CHARACTER_TYPE_META: Record<CharacterType, { label: string; color: string }> = {
  [CharacterType.MAIN]: { label: '주연', color: 'geekblue' },
  [CharacterType.SUB]: { label: '조연', color: 'cyan' },
  [CharacterType.EXTRA]: { label: '단역', color: 'default' },
};

/** 콘텐츠의 등장인물 목록 조회. */
export async function fetchCharacters(
  contentId: number,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<CharacterListItem>> {
  const response = await apiClient.get<PaginatedResponse<CharacterListItem>>(
    `/admins/contents/${contentId}/characters`,
    { params: { page: params.page, limit: params.limit } },
  );
  return response.data;
}

export interface CreateCharacterPayload {
  name: string;
  type: CharacterType;
  color: string;
}

/** 등장인물 생성(POST /admins/contents/:contentId/characters). */
export async function createCharacter(contentId: number, payload: CreateCharacterPayload): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/characters`, payload);
}
