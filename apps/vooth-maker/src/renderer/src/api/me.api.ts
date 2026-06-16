import { apiRequest } from '../lib/apiClient'

/**
 * 현재 로그인한 CREATOR 프로필.
 * 서버 `GET /creators/me` 는 Creator 엔티티를 반환한다(account 비포함 → email 은 토큰에서 사용).
 */
export interface MeCreator {
  id: number
  accountId: number
  /** 활동명 */
  nickname: string
  avatarFileId: number | null
  /** 표시용 아바타 public URL (avatarFileId 없으면 null) */
  avatarUrl: string | null
  bio: string | null
  createdAt?: string
  updatedAt?: string
}

/**
 * 현재 로그인한 CREATOR 정보 조회.
 * - 200: 승인된(역할 배정된) 계정 → Creator 프로필
 * - 403: 아직 승인되지 않은 계정 (승인 대기)
 * - 401: 토큰 없음/만료
 */
export function fetchMe(): Promise<MeCreator> {
  return apiRequest<MeCreator>('/creators/me')
}

/** 프로필 수정 입력. 서버 `CreatorUpdateDto`(nickname/avatarFileId/bio). */
export interface UpdateMeInput {
  nickname?: string
  avatarFileId?: number | null
  bio?: string | null
}

/** 내 프로필 수정. PUT /creators/me */
export async function updateMe(input: UpdateMeInput): Promise<void> {
  await apiRequest<unknown>('/creators/me', {
    method: 'PUT',
    body: JSON.stringify(input)
  })
}
