import { getAccessToken } from '../auth/token'

const API_BASE_URL = import.meta.env.RENDERER_VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ErrorBody {
  message?: string | string[]
}

interface DataEnvelope<T> {
  data: T
}

function resolveErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as ErrorBody
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
    throw new ApiError(response.status, resolveErrorMessage(response.status, parsed))
  }

  return (parsed as DataEnvelope<T>).data
}
