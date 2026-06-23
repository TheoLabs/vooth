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

/** POST /directors/episodes/:episodeId/lines 요청 아이템. anchorY 는 명시 숫자(0~1)만(균등=null 은 제외). */
export interface LineAnchorYItem {
  cutId: number
  lineId: number
  anchorY: number
}

/** POST /directors/episodes/:episodeId/lines — 대사 발화 위치(anchorY)를 일괄 저장. */
export function saveLineAnchorY(
  episodeId: number,
  anchorYItems: LineAnchorYItem[]
): Promise<unknown> {
  return apiRequest<unknown>(`/directors/episodes/${episodeId}/lines`, {
    method: 'POST',
    body: JSON.stringify({ anchorYItems })
  })
}
