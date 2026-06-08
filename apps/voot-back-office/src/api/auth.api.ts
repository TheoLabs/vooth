import { apiRequest } from '../lib/apiClient';

interface GoogleLoginResponse {
  accessToken: string;
}

/**
 * Google ID token 을 core-api 로 보내 앱 access token 으로 교환한다.
 * POST /admins/auth/login/google  body: { idToken }
 * 응답 봉투 { data: { accessToken } } 는 apiRequest 가 벗겨준다.
 */
export async function googleLogin(idToken: string): Promise<GoogleLoginResponse> {
  return apiRequest<GoogleLoginResponse>('/admins/auth/login/google', {
    method: 'POST',
    body: { idToken },
  });
}
