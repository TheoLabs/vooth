import { apiRequest } from '../lib/apiClient'

export interface DesktopGoogleLoginInput {
  code: string
  codeVerifier: string
  redirectUri: string
}

/**
 * 데스크톱 OAuth 인증 코드로 연출·제작(vooth-tool) 로그인.
 * 백엔드가 Google 과 코드를 교환하고 앱 accessToken 을 발급한다.
 * vooth-tool 은 directors 표면을 사용한다(연출자/검수자 = 내부 ADMIN 계정).
 */
export function desktopGoogleLogin(
  input: DesktopGoogleLoginInput
): Promise<{ accessToken: string }> {
  return apiRequest<{ accessToken: string }>('/directors/auth/login/google/desktop', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}
