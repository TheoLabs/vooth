import type { CharacterType } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 캐릭터 목록 응답(CharacterResponseDto). */
export interface AdminCharacter {
  id: number;
  name: string;
  type: CharacterType;
  description: string | null;
  avatarFileId: number | null;
  /** 표시용 아바타 public URL (없으면 null) */
  avatarUrl: string | null;
  order: number;
}

export interface CharacterListQuery {
  /** 서버는 name 검색만 허용 */
  searchKey?: 'name';
  searchValue?: string;
  types?: CharacterType[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 작품의 캐릭터 목록. GET /admins/contents/:contentId/characters */
export async function fetchCharacters(
  contentId: number,
  query: CharacterListQuery = {},
): Promise<PaginatedResponse<AdminCharacter>> {
  const res = await apiClient.get<PaginatedResponse<AdminCharacter>>(
    `/admins/contents/${contentId}/characters`,
    { params: query },
  );
  return res.data;
}

/** 캐릭터 상세. GET /admins/contents/:contentId/characters/:id */
export async function fetchCharacter(contentId: number, id: number): Promise<AdminCharacter> {
  const res = await apiClient.get<AdminCharacter>(
    `/admins/contents/${contentId}/characters/${id}`,
  );
  return res.data;
}

export interface CreateCharacterInput {
  name: string;
  type: CharacterType;
  description?: string;
  avatarFileId?: number;
}

/** 캐릭터 생성. POST /admins/contents/:contentId/characters */
export async function createCharacter(
  contentId: number,
  input: CreateCharacterInput,
): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/characters`, input);
}

/** 부분 수정: 변경된 필드만 보낸다. description/avatarFileId 는 null 로 비울 수 있다. */
export interface UpdateCharacterInput {
  name?: string;
  type?: CharacterType;
  description?: string | null;
  avatarFileId?: number | null;
}

/** 캐릭터 수정. PUT /admins/contents/:contentId/characters/:id */
export async function updateCharacter(
  contentId: number,
  id: number,
  input: UpdateCharacterInput,
): Promise<void> {
  await apiClient.put(`/admins/contents/${contentId}/characters/${id}`, input);
}
