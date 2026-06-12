import { apiRequest } from '../lib/apiClient'

export interface DesktopGoogleLoginInput {
  code: string
  codeVerifier: string
  redirectUri: string
}

/**
 * 데스크톱 OAuth 인증 코드로 CREATOR 로그인.
 * 백엔드가 Google 과 코드를 교환하고 앱 accessToken 을 발급한다.
 * 최초 로그인 시 PENDING 상태로 계정이 자동 생성된다(=회원가입).
 */
export function desktopGoogleLogin(
  input: DesktopGoogleLoginInput
): Promise<{ accessToken: string }> {
  return apiRequest<{ accessToken: string }>('/creators/auth/login/google/desktop', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}
