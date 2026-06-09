const ACCESS_TOKEN_KEY = 'vooth-maker.accessToken'

/** 앱 access token 의 JWT payload */
export interface AccessTokenPayload {
  sub: number
  email: string
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    // ignore storage write failures (e.g. private mode)
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // ignore storage write failures
  }
}

/** base64url -> utf-8 디코딩 */
function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

/**
 * JWT payload 를 디코딩한다. 외부 라이브러리 없이 atob 사용.
 * 형식이 잘못됐거나 필드가 없으면 null 반환.
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const json: unknown = JSON.parse(decodeBase64Url(payload))
    if (
      json &&
      typeof json === 'object' &&
      'sub' in json &&
      'email' in json &&
      typeof (json as Record<string, unknown>).email === 'string'
    ) {
      const sub = (json as Record<string, unknown>).sub
      return {
        sub: Number(sub),
        email: (json as Record<string, string>).email
      }
    }
    return null
  } catch {
    return null
  }
}
