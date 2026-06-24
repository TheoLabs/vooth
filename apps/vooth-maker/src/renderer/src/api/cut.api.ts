import { apiRequest } from '../lib/apiClient'
import type { Paginated } from './content.api'

/** 컷 내 대사. */
export interface CreatorLine {
  id: number
  cutId: number
  characterId: number
  script: string
  order: number
  anchorY: number | null
}

/** GET /creators/episodes/:episodeId/cuts 응답 아이템(Cut + lines). */
export interface CreatorCut {
  id: number
  episodeId: number
  order: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  lines: CreatorLine[]
}

/** GET /creators/episodes/:episodeId/cuts — 회차의 컷(+대사) 목록. */
export function fetchCreatorCuts(episodeId: number): Promise<Paginated<CreatorCut>> {
  return apiRequest<Paginated<CreatorCut>>(`/creators/episodes/${episodeId}/cuts`)
}
