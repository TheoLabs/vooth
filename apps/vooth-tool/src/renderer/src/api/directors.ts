import { apiRequest } from '../lib/apiClient'
import type { CropBox } from '../lib/cropBox'

/** GET /directors/episodes 의 회차 항목. */
export interface DirectorEpisodeListItem {
  id: number
  contentId: number
  contentTitle: string
  chapter: number
  title: string
  status: number
  cutCount: number
  lineCount: number
}

export interface DirectorLine {
  id: number
  characterId: number
  script: string
  position: number
  anchorY: number | null
  gapBeforeMs: number | null
}
export interface DirectorCut {
  id: number
  position: number
  imageUrl: string
  imageWidth: number | null
  imageHeight: number | null
  cropBox: CropBox | null
  holdMs: number | null
  lines: DirectorLine[]
}
export interface DirectorEpisodeDetail {
  episode: {
    id: number
    contentId: number
    title: string
    chapter: number
    status: number
    cutCount: number
    lineCount: number
    cuts: DirectorCut[]
  }
  contentTitle: string
  characters: { id: number; name: string }[]
}

/** 연출 대상 회차 목록. */
export function fetchDirectorEpisodes(): Promise<{ items: DirectorEpisodeListItem[]; total: number }> {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  return apiRequest<{ items: DirectorEpisodeListItem[]; total: number }>(`/directors/episodes?${query.toString()}`)
}

/** 회차 상세(컷·대사 + 연출 필드 + 캐릭터명). */
export function fetchDirectorEpisode(id: number | string): Promise<DirectorEpisodeDetail> {
  return apiRequest<DirectorEpisodeDetail>(`/directors/episodes/${id}`)
}

/** 연출 부분 저장(anchorY/gap/hold). */
export interface DirectionPayload {
  cuts: { id: number; holdMs?: number; lines?: { id: number; anchorY?: number; gapBeforeMs?: number }[] }[]
}
export function saveDirection(id: number | string, payload: DirectionPayload): Promise<unknown> {
  return apiRequest(`/directors/episodes/${id}/direction`, { method: 'PATCH', body: JSON.stringify(payload) })
}
