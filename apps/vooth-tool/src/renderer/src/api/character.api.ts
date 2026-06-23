import { apiRequest } from '../lib/apiClient'
import type { Paginated } from './episode.api'

/** GET /directors/contents/:contentId/characters 응답 아이템(Character). color 는 없음. */
export interface DirectorCharacter {
  id: number
  contentId: number
  name: string
  type?: string
  order?: number
  avatarFileId?: number | null
}

/** GET /directors/contents/:contentId/characters — 작품 캐릭터(화자) 목록. */
export function fetchDirectorCharacters(contentId: number): Promise<Paginated<DirectorCharacter>> {
  return apiRequest<Paginated<DirectorCharacter>>(`/directors/contents/${contentId}/characters`)
}
