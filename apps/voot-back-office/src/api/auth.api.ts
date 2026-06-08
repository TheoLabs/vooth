import type { AuthUser } from '../auth/types';

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
}

// TODO: 실제 Google OAuth + 백엔드 API 연동 시 이 mock 을 교체한다.
const MOCK_GOOGLE_USER: AuthUser = {
  id: 'acc_0001',
  email: 'admin@vooth.com',
  name: 'Vooth 관리자',
  role: 'SUPER_ADMIN',
  permissions: ['account:read', 'account:write', 'role:read', 'role:write', 'permission:write'],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Google 로그인 mock. 실제로는 Google OAuth 토큰을 받아 백엔드로 교환한다.
 */
export async function mockGoogleLogin(): Promise<LoginResult> {
  await delay(900);
  return { user: MOCK_GOOGLE_USER, accessToken: 'mock-google-access-token' };
}
