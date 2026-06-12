import { apiRequest } from '../lib/apiClient'

/** 콘텐츠에 연결된 태그. */
export interface ContentTag {
  id: number
  name: string
  color: string
}

/** GET /creators/contents 응답의 콘텐츠(게시된 것만 내려옴). */
export interface ContentListItem {
  id: number
  title: string
  description: string
  thumbnailImageUrl: string
  status: string
  tags: ContentTag[]
}

/** 콘텐츠 상태 칩 라벨/색. */
export const CONTENT_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: '편집중', color: '#8c8c8c' },
  recording: { label: '녹음 대기', color: '#1677ff' },
  scheduled: { label: '발행 예정', color: '#faad14' },
  published: { label: '발행', color: '#52c41a' },
  archived: { label: '아카이브', color: '#8c8c8c' }
}

/** TagColor → hex(칩 색). */
export const TAG_COLOR_HEX: Record<string, string> = {
  RED: '#f5222d',
  ORANGE: '#fa8c16',
  GOLD: '#faad14',
  GREEN: '#52c41a',
  CYAN: '#13c2c2',
  BLUE: '#1677ff',
  INDIGO: '#2f54eb',
  PURPLE: '#722ed1',
  MAGENTA: '#eb2f96',
  GRAY: '#8c8c8c'
}

export interface ContentListResponse {
  items: ContentListItem[]
  total: number
}

/** 성우용 콘텐츠 목록(게시/녹음 가능 콘텐츠). 페이지네이션(page/limit). */
export function fetchContents(params: { page: number; limit: number }): Promise<ContentListResponse> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  return apiRequest<ContentListResponse>(`/creators/contents?${query.toString()}`)
}

/** GET /creators/contents/:id 응답(상세). 목록 항목 + 발행 예정일. */
export interface ContentDetail extends ContentListItem {
  expectedPublishOn?: string | null
}

/** 성우용 콘텐츠 상세 1건. */
export function fetchContentDetail(id: number | string): Promise<ContentDetail> {
  return apiRequest<ContentDetail>(`/creators/contents/${id}`)
}
