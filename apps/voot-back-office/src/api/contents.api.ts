import { ContentStatus, TagColor } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 콘텐츠에 연결된 태그(목록 응답에 포함되는 부분 필드). */
export interface ContentTag {
  id: number;
  name: string;
  color: TagColor;
}

/** GET /admins/contents 응답의 콘텐츠(작품) 모델. */
export interface ContentListItem {
  id: number;
  thumbnailImageUrl: string;
  title: string;
  description: string;
  status: ContentStatus;
  /** 발행 예정 일시(UTC ISO). 채워지면 SCHEDULED 자동 전이. */
  scheduledPublishAt?: string | null;
  tags: ContentTag[];
  createdAt: string;
  updatedAt: string;
}

/** ContentStatus 표시 메타(lifecycle 라벨). */
export const CONTENT_STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  [ContentStatus.PENDING]: { label: '편집중', color: 'default' },
  [ContentStatus.RECORDING]: { label: '녹음 대기', color: 'blue' },
  [ContentStatus.SCHEDULED]: { label: '발행 예정', color: 'gold' },
  [ContentStatus.PUBLISHED]: { label: '발행', color: 'green' },
  [ContentStatus.ARCHIVED]: { label: '아카이브', color: 'default' },
};

export interface FetchContentsParams {
  page: number;
  limit: number;
  searchKey?: string;
  searchValue?: string;
  statuses?: ContentStatus[];
}

/** 콘텐츠 목록 조회(GET /admins/contents). 빈 검색/필터는 쿼리에서 제외한다. */
export async function fetchContents(params: FetchContentsParams): Promise<PaginatedResponse<ContentListItem>> {
  const hasSearch = Boolean(params.searchKey && params.searchValue);
  const hasStatuses = Boolean(params.statuses && params.statuses.length > 0);

  const response = await apiClient.get<PaginatedResponse<ContentListItem>>('/admins/contents', {
    params: {
      page: params.page,
      limit: params.limit,
      searchKey: hasSearch ? params.searchKey : undefined,
      searchValue: hasSearch ? params.searchValue : undefined,
      statuses: hasStatuses ? params.statuses : undefined,
    },
  });
  return response.data;
}

/** 콘텐츠 상세 조회(GET /admins/contents/:id). */
export async function fetchContent(id: number): Promise<ContentListItem> {
  const response = await apiClient.get<ContentListItem>(`/admins/contents/${id}`);
  return response.data;
}

export interface CreateContentPayload {
  title: string;
  description: string;
  thumbnailImageUrl: string;
  tagIds: number[];
}

/** 콘텐츠 등록(POST /admins/contents). 중복 제목이면 "이미 등록된 콘텐츠입니다." 에러. */
export async function createContent(payload: CreateContentPayload): Promise<void> {
  await apiClient.post('/admins/contents', payload);
}

export interface UpdateContentPayload {
  title?: string;
  description?: string;
  thumbnailImageUrl?: string;
  tagIds?: number[];
  /** 발행 예정 일시(ISO). null 로 보내면 예약 해제. 채우면 SCHEDULED 자동 전이. */
  scheduledPublishAt?: string | null;
}

/** 콘텐츠 기본 정보 수정(PUT /admins/contents/:id). */
export async function updateContent(id: number, payload: UpdateContentPayload): Promise<void> {
  await apiClient.put(`/admins/contents/${id}`, payload);
}

/** 콘텐츠 상태 변경(PUT /admins/contents/:id/status). 허용 전이만(canTransitionContent). */
export async function updateContentStatus(id: number, nextStatus: ContentStatus): Promise<void> {
  await apiClient.put(`/admins/contents/${id}/status`, { nextStatus });
}
