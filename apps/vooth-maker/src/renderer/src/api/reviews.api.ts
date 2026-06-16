import { ApiError, apiRequest } from '../lib/apiClient'

/** ReviewStatus(@vooth/shared) 숫자 값. */
export const REVIEW_STATUS = {
  REQUESTED: 10, // 검수 대기
  APPROVED: 20, // 검수 통과
  REJECTED: 30 // 반려
} as const

/** GET /creators/reviews/episodes/:episodeId — 내 검수 레코드. */
export interface MyReview {
  id: number
  contentId: number
  episodeId: number
  creatorId: number
  status: number
  rejectReason: string | null
}

/**
 * 회차 검수 요청(성우). 내가 캐스팅된 모든 대사를 채택했을 때만 서버가 수락한다.
 * 이미 요청됐거나 미완성이면 400(ApiError.message)으로 거부된다.
 */
export function requestReview(episodeId: number): Promise<unknown> {
  return apiRequest('/creators/reviews', {
    method: 'POST',
    body: JSON.stringify({ episodeId })
  })
}

/**
 * 반려된 검수 재요청(성우). REJECTED → REQUESTED.
 * TODO: 서버에 재검토 요청 엔드포인트가 생기면 동작한다.
 */
export function reRequestReview(episodeId: number): Promise<unknown> {
  return apiRequest(`/creators/reviews/episodes/${episodeId}/re-request`, { method: 'POST' })
}

/**
 * 내 검수 상태 조회. 아직 요청하지 않았으면(서버 400) null 로 정규화한다.
 */
export async function fetchMyReview(episodeId: number): Promise<MyReview | null> {
  try {
    return await apiRequest<MyReview>(`/creators/reviews/episodes/${episodeId}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return null
    throw e
  }
}
