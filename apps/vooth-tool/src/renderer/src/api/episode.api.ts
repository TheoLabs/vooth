import { apiRequest } from '../lib/apiClient'
import type { EpisodeStatus } from '../domain/types'

/**
 * directors/episodes 응답 아이템(백엔드 Episode).
 * 응답 형태가 아직 확정 전이라 느슨하게 둔다(필드는 추후 정렬).
 */
export interface DirectorEpisode {
  id: number
  contentId: number
  status: EpisodeStatus
  title: string
  chapter: number
  isFree?: boolean
  expectedPublishOn?: string | null
  /** 집계값 — 백엔드에서 내려주면 표시(현재 응답 미포함). */
  cutCount?: number
  lineCount?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export interface DirectorEpisodeListParams {
  searchValue?: string
  statuses?: EpisodeStatus[]
  page?: number
  limit?: number
}

/**
 * GET /directors/contents/:contentId/episodes — 작품 하위 회차 목록.
 * contentId 는 경로 파라미터(서버가 콘텐츠로 필터). 쿼리는 searchValue/statuses/pagination.
 */
export function fetchDirectorEpisodes(
  contentId: number,
  params: DirectorEpisodeListParams = {}
): Promise<Paginated<DirectorEpisode>> {
  const qs = new URLSearchParams()
  if (params.searchValue) qs.set('searchValue', params.searchValue)
  // 배열 쿼리는 반복 파라미터(?statuses=a&statuses=b)로 직렬화.
  for (const s of params.statuses ?? []) qs.append('statuses', s)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const q = qs.toString()
  return apiRequest<Paginated<DirectorEpisode>>(
    `/directors/contents/${contentId}/episodes${q ? `?${q}` : ''}`
  )
}

/** GET /directors/contents/:contentId/episodes/:episodeId — 회차 상세(메타). */
export function fetchDirectorEpisode(
  contentId: number,
  episodeId: number
): Promise<DirectorEpisode> {
  return apiRequest<DirectorEpisode>(`/directors/contents/${contentId}/episodes/${episodeId}`)
}

/**
 * PUT /directors/contents/:contentId/episodes/:episodeId/status — 회차 상태 전이.
 * 단일 엔드포인트가 status(DRAFT|READY)를 받아 전이(서버 allowlist 검증). 녹음대기/초안 분리 안 함.
 */
export function changeEpisodeStatus(
  contentId: number,
  episodeId: number,
  status: EpisodeStatus
): Promise<unknown> {
  return apiRequest<unknown>(`/directors/contents/${contentId}/episodes/${episodeId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
}
