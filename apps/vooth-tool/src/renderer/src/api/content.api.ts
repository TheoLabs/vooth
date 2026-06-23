import { apiRequest } from '../lib/apiClient'
import type { Paginated } from './episode.api'

/** 작품 상태(ContentStatus, @vooth/shared). */
export const CONTENT_STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  ready: '녹음 대기',
  recording: '녹음 중',
  reviewing: '검수 중',
  approved: '검수 완료',
  scheduled: '발행 대기',
  published: '발행',
  archived: '보관'
}

/** GET /directors/contents 응답 아이템(DirectorContentResponseDto). */
export interface DirectorContent {
  id: number
  title: string
  description: string
  status: string
  thumbnailUrl: string | null
  episodeCount: number
  thumbnailFileId?: number | null
  expectedPublishOn?: string | null
}

export interface DirectorContentListParams {
  /** 제목 검색어(searchKey='title' 고정). */
  searchValue?: string
  statuses?: string[]
  page?: number
  limit?: number
}

/** GET /directors/contents — 작품 목록(작품-퍼스트 탐색의 1단계). */
export function fetchDirectorContents(
  params: DirectorContentListParams = {}
): Promise<Paginated<DirectorContent>> {
  const qs = new URLSearchParams()
  if (params.searchValue) {
    qs.set('searchKey', 'title')
    qs.set('searchValue', params.searchValue)
  }
  for (const s of params.statuses ?? []) qs.append('statuses', s)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const q = qs.toString()
  return apiRequest<Paginated<DirectorContent>>(`/directors/contents${q ? `?${q}` : ''}`)
}

/** GET /directors/contents/:id — 작품 상세(단건). */
export function fetchDirectorContent(contentId: number): Promise<DirectorContent> {
  return apiRequest<DirectorContent>(`/directors/contents/${contentId}`)
}
