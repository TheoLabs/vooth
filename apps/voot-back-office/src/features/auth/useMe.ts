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
    // /me 는 세션당 한 번만 가져온다. 새 옵저버(마운트)마다 재요청해
    // 무한 refetch 루프가 도는 것을 막는다. 명시적 refetch() 와
    // invalidateQueries(['me']) 는 여전히 동작한다.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
