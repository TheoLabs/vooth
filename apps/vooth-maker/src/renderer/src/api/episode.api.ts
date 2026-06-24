import { apiRequest } from '../lib/apiClient'
import type { Paginated } from './content.api'

/** GET /creators/contents/:contentId/episodes 응답 아이템(Episode). */
export interface CreatorEpisode {
  id: number
  contentId: number
  title: string
  chapter: number
  status: string
  isFree?: boolean
}

export interface CreatorEpisodeListParams {
  /** 회차 제목 검색어(searchKey='title' 고정). */
  searchValue?: string
}

/** GET /creators/contents/:contentId/episodes — 작품의 회차 목록. */
export function fetchCreatorEpisodes(
  contentId: number,
  params: CreatorEpisodeListParams = {}
): Promise<Paginated<CreatorEpisode>> {
  const qs = new URLSearchParams()
  if (params.searchValue) {
    qs.set('searchKey', 'title')
    qs.set('searchValue', params.searchValue)
  }
  const q = qs.toString()
  return apiRequest<Paginated<CreatorEpisode>>(
    `/creators/contents/${contentId}/episodes${q ? `?${q}` : ''}`
  )
}
