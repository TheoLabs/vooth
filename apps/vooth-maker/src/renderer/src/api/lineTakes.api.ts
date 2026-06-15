import { apiRequest } from '../lib/apiClient'

/** GET /creators/line-takes 항목(내 채택). */
export interface LineTakeItem {
  id: number
  lineId: number
  episodeId: number
  creatorId: number
  recordingId: number
}

/** 회차의 내 채택 목록. */
export function fetchLineTakes(episodeId: number | string): Promise<{ items: LineTakeItem[] }> {
  const query = new URLSearchParams({ episodeId: String(episodeId), page: '1', limit: '500' })
  return apiRequest<{ items: LineTakeItem[] }>(`/creators/line-takes?${query.toString()}`)
}

/** (라인 × 본인) 최종 take 채택/변경. */
export function selectLineTake(lineId: number, recordingId: number): Promise<unknown> {
  return apiRequest('/creators/line-takes', { method: 'PUT', body: JSON.stringify({ lineId, recordingId }) })
}

/** 채택 해제. */
export function clearLineTake(lineId: number): Promise<unknown> {
  return apiRequest(`/creators/line-takes/${lineId}`, { method: 'DELETE' })
}
