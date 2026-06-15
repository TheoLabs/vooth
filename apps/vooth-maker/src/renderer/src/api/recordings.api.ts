import { apiRequest } from '../lib/apiClient'

/** POST /creators/recordings 바디. take 는 서버가 부여한다. */
export interface CreateRecordingPayload {
  lineId: number
  episodeId: number
  audioUrl: string
  durationMs: number
}

/** 녹음 take 생성(성우). 동일 (line, creator, take) 중복 시 서버에서 거부. */
export function createRecording(payload: CreateRecordingPayload): Promise<unknown> {
  return apiRequest('/creators/recordings', { method: 'POST', body: JSON.stringify(payload) })
}

/** GET /creators/recordings 응답 항목(본인 녹음만). status=RecordingStatus 숫자. */
export interface RecordingItem {
  id: number
  lineId: number
  episodeId: number
  creatorId: number
  audioUrl: string
  durationMs: number
  status: number
  take: number
  rejectReason: string | null
}

export interface RecordingListResponse {
  items: RecordingItem[]
  total: number
}

/** 회차의 내 녹음 목록. */
export function fetchRecordings(episodeId: number | string): Promise<RecordingListResponse> {
  const query = new URLSearchParams({ episodeId: String(episodeId), page: '1', limit: '500' })
  return apiRequest<RecordingListResponse>(`/creators/recordings?${query.toString()}`)
}
