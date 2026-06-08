import { getAccessToken } from '../auth/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** core-api 응답 봉투: { data: T } */
interface ApiEnvelope<T> {
  data: T;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * 작은 fetch 래퍼.
 * - VITE_API_BASE_URL 을 base 로 사용 (기본값 http://localhost:3000)
 * - 저장된 토큰이 있으면 Authorization 헤더 부착
 * - JSON 파싱 후 { data } 봉투를 벗겨서 반환
 * - 2xx 가 아니면 의미 있는 메시지로 throw
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? `요청에 실패했습니다 (HTTP ${response.status})`;
    throw new ApiError(response.status, message);
  }

  return (parsed as ApiEnvelope<T>)?.data;
}
