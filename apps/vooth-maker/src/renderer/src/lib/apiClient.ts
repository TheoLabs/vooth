import { clearAccessToken, getAccessToken } from '../auth/token'

const API_BASE_URL = import.meta.env.RENDERER_VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** core-api 에러 본문: 전역 ExceptionFilter 가 `{ data: { message } }` 로 내려준다. */
interface ErrorBody {
  data?: { message?: string | string[] }
}

interface DataEnvelope<T> {
  data: T
}

function resolveErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'data' in body) {
    const message = (body as ErrorBody).data?.message
    if (Array.isArray(message) && message.length > 0) return message.join(', ')
    if (typeof message === 'string' && message.length > 0) return message
  }
  return `요청에 실패했습니다. (HTTP ${status})`
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()

  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  const text = await response.text()
  const parsed: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    // 401(토큰 없음/만료) → 세션 정리 후 로그인 페이지로 이동(HashRouter).
    if (response.status === 401) {
      clearAccessToken()
      if (!window.location.hash.startsWith('#/login')) {
        window.location.hash = '#/login'
      }
    }
    throw new ApiError(response.status, resolveErrorMessage(response.status, parsed))
  }

  return (parsed as DataEnvelope<T>).data
}
