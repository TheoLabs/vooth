import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from './types'
import { clearAccessToken, decodeAccessToken, getAccessToken, setAccessToken } from './token'

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** access token 으로부터 AuthUser 파생 */
function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null
  const payload = decodeAccessToken(token)
  if (!payload) return null
  return {
    id: String(payload.sub),
    email: payload.email
  }
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [accessToken, setToken] = useState<string | null>(() => {
    const stored = getAccessToken()
    // 저장된 토큰이 손상됐으면 폐기
    return stored && decodeAccessToken(stored) ? stored : null
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user: userFromToken(accessToken),
      login: (token) => {
        setAccessToken(token)
        setToken(token)
      },
      logout: () => {
        clearAccessToken()
        setToken(null)
      }
    }),
    [accessToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
