/**
 * 페이지네이션 기반 목록 응답의 표준 엔벨로프.
 * apiClient 가 외부 `{ data }` 래퍼를 이미 벗겨낸 형태를 가정한다.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
