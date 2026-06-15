import { apiRequest } from '../lib/apiClient'

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
