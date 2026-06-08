import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { mockLogin } from '../../api/auth.api'
import { useAuth } from '../../auth/AuthContext'
import { setAccessToken } from '../../auth/token'
import type { AuthUser } from '../../auth/types'
import type { LoginInput } from './login.schema'

export function useLoginMutation(): UseMutationResult<
  { user: AuthUser; accessToken: string },
  Error,
  LoginInput
> {
  const auth = useAuth()
  const navigate = useNavigate()

  return useMutation<{ user: AuthUser; accessToken: string }, Error, LoginInput>({
    mutationFn: mockLogin,
    onSuccess: ({ user, accessToken }) => {
      setAccessToken(accessToken)
      auth.login(user)
      navigate('/', { replace: true })
    }
  })
}
