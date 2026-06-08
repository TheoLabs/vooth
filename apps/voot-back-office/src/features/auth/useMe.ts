import { useQuery } from '@tanstack/react-query';
import { fetchMe, type MeAccount } from '../../api/me.api';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';

export const meQueryKey = ['me'] as const;

/**
 * 로그인한 관리자 본인 계정(GET /admins/me)을 조회한다.
 * 인증된 사용자가 있을 때만 활성화된다.
 *
 * 승인 전(403)/퇴사(403)/토큰 만료(401) 는 정상적인 게이트 분기이므로
 * 재시도하지 않는다.
 */
export function useMe() {
  const { user } = useAuth();

  return useQuery<MeAccount, ApiError>({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: Boolean(user),
    retry: false,
  });
}
