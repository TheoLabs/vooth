import { apiRequest } from '../lib/apiClient'

export interface Paginated<T> {
  items: T[]
  total: number
}

/** 작품 상태(ContentStatus) 라벨. */
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

export interface ContentTag {
  id: number
  name: string
  color: string
}

/** GET /creators/contents 응답 아이템(작품). */
export interface CreatorContent {
  id: number
  title: string
  description?: string
  status?: string
  thumbnailUrl?: string | null
  episodeCount?: number
  tags?: ContentTag[]
  /** 녹음이 필요한 회차 수. 응답에 추가되면 표시. */
  pendingEpisodeCount?: number
}

export interface CreatorContentListParams {
  /** 제목 검색어(searchKey='title' 고정). */
  searchValue?: string
  page?: number
  limit?: number
}

/** GET /creators/contents — 내 작업(배정) 작품 목록. */
export function fetchCreatorContents(
  params: CreatorContentListParams = {}
): Promise<Paginated<CreatorContent>> {
  const qs = new URLSearchParams()
  if (params.searchValue) {
    qs.set('searchKey', 'title')
    qs.set('searchValue', params.searchValue)
  }
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const q = qs.toString()
  return apiRequest<Paginated<CreatorContent>>(`/creators/contents${q ? `?${q}` : ''}`)
}

/** GET /creators/contents/:contentId — 작품 상세(단건). */
export function fetchCreatorContent(contentId: number): Promise<CreatorContent> {
  return apiRequest<CreatorContent>(`/creators/contents/${contentId}`)
}
