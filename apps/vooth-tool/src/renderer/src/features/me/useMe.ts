import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchMe, type MeAccount } from '../../api/me.api'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from '../../auth/AuthContext'

export const ME_QUERY_KEY = ['me'] as const

export function useMe(): UseQueryResult<MeAccount, ApiError> {
  const { user } = useAuth()

  return useQuery<MeAccount, ApiError>({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled: Boolean(user),
    // 401/403 등 인증·승인 오류는 재시도해도 해결되지 않으므로 비활성화.
    retry: false,
    // /me 는 세션당 1회만 가져온다. ApprovalGate·PendingApprovalPage 등
    // 여러 옵저버가 마운트돼도 추가 요청이 발생하지 않도록 한다.
    // 명시적 refetch() 와 쿼리 무효화는 여전히 동작한다.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // 승인 대기(403)면 쿼리가 "에러 + data 없음" 상태라 refetchOnMount 가 아니라
    // retryOnMount(기본 true) 가 지배 → 옵저버 마운트마다 /directors/me 재요청(무한 루프).
    // 끄면 에러 상태에서 마운트 재페치를 막는다(다시 확인 버튼/invalidate 는 동작).
    retryOnMount: false
  })
}
