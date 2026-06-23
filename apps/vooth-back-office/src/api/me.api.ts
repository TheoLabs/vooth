import { apiClient } from '../lib/apiClient';

/** 관리자 계정 상태 도메인 (백엔드 status 와 1:1 매핑) */
export type MeStatus = 'pending' | 'active' | 'exited';

/**
 * GET /admins/me 응답 계정 모델.
 * roleId 가 없으면 승인 전(PENDING), status 가 exited 면 퇴사 계정이다.
 */
export interface MeAccount {
  id: number;
  email: string;
  googleSub: string;
  roleId: number | null;
  status: MeStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** 로그인한 관리자 본인 계정을 조회한다. */
export async function fetchMe(): Promise<MeAccount> {
  const response = await apiClient.get<MeAccount>('/admins/me');
  return response.data;
}
