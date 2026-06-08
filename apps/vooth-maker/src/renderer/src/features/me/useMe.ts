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
    retry: (failureCount, error) => {
      // Do not retry auth/permission errors; they will not resolve on retry.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return false
      }
      return failureCount < 1
    }
  })
}
