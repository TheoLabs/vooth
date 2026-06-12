import { apiRequest } from '../lib/apiClient'

/** GET /creators/contents/:contentId/episodes 의 회차 항목. */
export interface EpisodeListItem {
  id: number
  contentId: number
  title: string
  chapter: number
  /** EpisodeStatus 숫자 enum(10/20/30/40/50/60). */
  status: number
  cutCount: number
  lineCount: number
}

export interface EpisodeListResponse {
  items: EpisodeListItem[]
  total: number
}

/** EpisodeStatus(숫자) → 칩 라벨/색. (@vooth/shared 미의존 — 로컬 메타) */
export const EPISODE_STATUS_META: Record<number, { label: string; color: string }> = {
  10: { label: '편집중', color: '#8c8c8c' },
  20: { label: '녹음 대기', color: '#1677ff' },
  30: { label: '녹음 중', color: '#722ed1' },
  40: { label: '검수', color: '#faad14' },
  50: { label: '승인', color: '#13c2c2' },
  60: { label: '발행', color: '#52c41a' }
}

/** 콘텐츠의 회차 목록(성우용). */
export function fetchEpisodes(contentId: number | string): Promise<EpisodeListResponse> {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  return apiRequest<EpisodeListResponse>(`/creators/contents/${contentId}/episodes?${query.toString()}`)
}
