/**
 * 인증 사용자 모델. access token payload 는 { sub, email } 만 담고 있어
 * 토큰에서 파생되는 최소 정보만 가진다. (이름/상태 등은 /directors/me 로 보강)
 */
export interface AuthUser {
  id: string
  email: string
}
