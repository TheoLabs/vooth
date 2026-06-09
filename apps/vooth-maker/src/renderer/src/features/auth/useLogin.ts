import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { desktopGoogleLogin } from '../../api/auth.api'
import { useAuth } from '../../auth/AuthContext'

/**
 * 시스템 브라우저로 Google 데스크톱 OAuth 를 수행해 인증 코드를 받고,
 * 백엔드와 교환해 앱 accessToken 을 발급받은 뒤 로그인 → 홈 이동.
 */
export function useGoogleLogin(): UseMutationResult<{ accessToken: string }, Error, void> {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation<{ accessToken: string }, Error, void>({
    mutationFn: async () => {
      const bundle = await window.api.loginWithGoogle()
      return desktopGoogleLogin(bundle)
    },
    onSuccess: ({ accessToken }) => {
      login(accessToken)
      navigate('/', { replace: true })
    }
  })
}
