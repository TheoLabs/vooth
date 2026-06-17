import axios, { AxiosError } from 'axios';
import { clearAccessToken, getAccessToken } from '../auth/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** core-api 응답 봉투: { data: T } */
interface ApiEnvelope<T> {
  data: T;
}

/**
 * core-api 에러 응답 본문.
 * 전역 ExceptionFilter 가 `{ data: { message } }` 형태로 내려준다(성공 응답과 동일하게 data 봉투).
 * message 는 string 또는 string[](검증 에러).
 */
interface ApiErrorBody {
  data?: { message?: string | string[] };
}

/**
 * 전송 계층 공통 에러.
 * 소비자는 `error.status` / `error.message` 만 읽는다 (ApprovalGate, RolesPage 등).
 */
export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(status: number | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** 백엔드 message(string | string[]) 를 단일 문자열로 정규화한다. */
function resolveErrorMessage(error: AxiosError<ApiErrorBody>): string {
  const message = error.response?.data?.data?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  return error.message;
}

/**
 * 앱 공용 axios 인스턴스.
 * - VITE_API_BASE_URL 을 base 로 사용 (기본값 http://localhost:3000)
 * - 배열 쿼리 파라미터는 반복 파라미터(`?a=1&a=2`)로 직렬화 (브래킷 `a[]` 금지)
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  paramsSerializer: { indexes: null },
});

// 요청 인터셉터: 저장된 토큰이 있으면 Authorization 헤더 부착.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// 응답 인터셉터:
// - 성공 시 { data } 봉투를 벗겨 내부 payload 를 반환한다.
// - 실패 시 status/message 를 정규화한 ApiError 로 reject 한다.
apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown> | undefined;
    response.data = envelope?.data;
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorBody>;
      // 401(토큰 없음/만료) → 세션 정리 후 로그인 페이지로 이동.
      if (axiosError.response?.status === 401) {
        clearAccessToken();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      // 404 → "페이지를 찾을 수 없습니다" 페이지로 이동.
      if (axiosError.response?.status === 404 && window.location.pathname !== '/404') {
        window.location.assign('/404');
      }
      return Promise.reject(
        new ApiError(axiosError.response?.status, resolveErrorMessage(axiosError)),
      );
    }
    return Promise.reject(
      new ApiError(undefined, error instanceof Error ? error.message : '요청에 실패했습니다.'),
    );
  },
);
