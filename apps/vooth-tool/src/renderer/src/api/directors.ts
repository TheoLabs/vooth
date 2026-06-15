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

/** 콘텐츠 태그(조인). color 는 TagColor 문자열('RED' 등). */
export interface DirectorContentTag {
  id: number
  name: string
  color: string
}
/** GET /directors/contents — 검수/제작 대상 콘텐츠 목록(RECORDING). */
export interface DirectorContentItem {
  id: number
  title: string
  thumbnailImageUrl: string
  description: string
  status: string
  tags: DirectorContentTag[]
}
export function fetchDirectorContents(params?: {
  /** 제목 검색어. */
  title?: string
}): Promise<{ items: DirectorContentItem[]; total: number }> {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  const title = params?.title?.trim()
  if (title) {
    query.set('searchKey', 'title')
    query.set('searchValue', title)
  }
  return apiRequest<{ items: DirectorContentItem[]; total: number }>(`/directors/contents?${query.toString()}`)
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

/** GET /directors/episodes/:id/takes — 라인별 채택 take(오디오/길이, 전 성우). */
export interface DirectorTakeItem {
  lineId: number
  creatorId: number
  recordingId: number
  audioUrl: string | null
  durationMs: number | null
}
export function fetchDirectorTakes(episodeId: number | string): Promise<{ items: DirectorTakeItem[] }> {
  return apiRequest<{ items: DirectorTakeItem[] }>(`/directors/episodes/${episodeId}/takes`)
}

/** 연출 부분 저장(anchorY/gap/hold). */
export interface DirectionPayload {
  cuts: { id: number; holdMs?: number; lines?: { id: number; anchorY?: number; gapBeforeMs?: number }[] }[]
}
export function saveDirection(id: number | string, payload: DirectionPayload): Promise<unknown> {
  return apiRequest(`/directors/episodes/${id}/direction`, { method: 'PATCH', body: JSON.stringify(payload) })
}
