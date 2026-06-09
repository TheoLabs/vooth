import { apiRequest } from '../lib/apiClient'

export interface MeAccount {
  id: number
  email: string
  name: string
  type: string
  status: string
  roleId: number | null
}

/**
 * 현재 로그인한 CREATOR 정보 조회.
 * - 200: 승인된(역할 배정된) 계정
 * - 403: 아직 승인되지 않은 계정 (승인 대기)
 * - 401: 토큰 없음/만료
 */
export function fetchMe(): Promise<MeAccount> {
  return apiRequest<MeAccount>('/creators/me')
}
