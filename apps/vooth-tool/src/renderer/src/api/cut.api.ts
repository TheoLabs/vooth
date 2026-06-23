import { apiRequest } from '../lib/apiClient'
import type { Paginated } from './episode.api'

/** 컷 내 대사(LineResponseDto). */
export interface DirectorLine {
  id: number
  cutId: number
  characterId: number
  script: string
  order: number
  anchorY: number | null
  anchorMetadata?: unknown
}

/** GET /directors/episodes/:episodeId/cuts 응답 아이템(DirectorCutListResponseDto). */
export interface DirectorCut {
  id: number
  episodeId: number
  order: number
  imageFileId: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  gap: number | null
  holdOverride: number | null
  lines: DirectorLine[]
}

/** GET /directors/episodes/:episodeId/cuts — 회차의 컷(+대사) 목록. */
export function fetchDirectorCuts(episodeId: number): Promise<Paginated<DirectorCut>> {
  return apiRequest<Paginated<DirectorCut>>(`/directors/episodes/${episodeId}/cuts`)
}
