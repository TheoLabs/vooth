import { EpisodeStatus } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** GET /admins/contents/:contentId/episodes 응답의 회차 모델. */
export interface EpisodeListItem {
  id: number;
  contentId: number;
  title: string;
  /** 회차 번호. */
  chapter: number;
  /** 회차 상태(숫자 enum). */
  status: EpisodeStatus;
  /** 컷 수(비정규화). */
  cutCount: number;
  /** 대사 수(비정규화). */
  lineCount: number;
}

/** EpisodeStatus 표시 메타(라벨/색). */
export const EPISODE_STATUS_META: Record<EpisodeStatus, { label: string; color: string }> = {
  [EpisodeStatus.DRAFT]: { label: '편집중', color: 'default' },
  [EpisodeStatus.READY]: { label: '녹음 대기', color: 'blue' },
  [EpisodeStatus.RECORDING]: { label: '녹음 중', color: 'processing' },
  [EpisodeStatus.REVIEW]: { label: '검수 대기', color: 'gold' },
  [EpisodeStatus.APPROVED]: { label: '검수 완료', color: 'cyan' },
  [EpisodeStatus.PUBLISHED]: { label: '발행', color: 'green' },
};

/** 상태 필터/선택용 옵션(숫자 enum이라 숫자 값만 추린다). */
export const EPISODE_STATUS_OPTIONS = (
  Object.values(EpisodeStatus).filter((v): v is EpisodeStatus => typeof v === 'number')
).map((v) => ({ value: v, label: EPISODE_STATUS_META[v].label }));

/**
 * 콘텐츠의 회차 목록 조회(서버 페이지네이션/검색/필터/정렬).
 * - searchValue: 제목(title) LIKE 서버 검색
 * - statuses: 상태 필터(IN)
 * - sort/order: 단일 정렬(chapter/title/status)
 */
export async function fetchEpisodes(
  contentId: number,
  params?: {
    page?: number;
    limit?: number;
    searchValue?: string;
    statuses?: EpisodeStatus[];
    sort?: string;
    order?: 'ASC' | 'DESC';
  },
): Promise<PaginatedResponse<EpisodeListItem>> {
  const searchValue = params?.searchValue?.trim() || undefined;
  const statuses = params?.statuses && params.statuses.length ? params.statuses : undefined;
  const response = await apiClient.get<PaginatedResponse<EpisodeListItem>>(
    `/admins/contents/${contentId}/episodes`,
    {
      params: {
        page: params?.page,
        limit: params?.limit,
        searchKey: searchValue ? 'title' : undefined,
        searchValue,
        statuses,
        sort: params?.sort || undefined,
        order: params?.order || undefined,
      },
    },
  );
  return response.data;
}

/** 상세 조회 응답의 대사. anchorY=컷 내 세로 위치(0~1), gapBeforeMs=앞 간격(연출용). */
export interface EpisodeLine {
  id: number;
  characterId: number;
  script: string;
  position: number;
  anchorY: number | null;
  gapBeforeMs: number | null;
}
/** 표시용 정규화 크롭 박스(0~1). 원본에서 16:10 등으로 보여줄 영역. */
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** 상세 조회 응답의 컷(+대사). imageUrl=원본, cropBox=표시 영역. */
export interface EpisodeCut {
  id: number;
  position: number;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  cropBox: CropBox | null;
  holdMs: number | null;
  lines: EpisodeLine[];
}
/** 회차 상세(기본 정보 + 컷/대사). */
export interface EpisodeDetail extends EpisodeListItem {
  cuts: EpisodeCut[];
}

/** 회차 상세 조회(GET /admins/contents/:contentId/episodes/:id). cuts/lines 포함. */
export async function fetchEpisode(contentId: number, episodeId: number): Promise<EpisodeDetail> {
  const response = await apiClient.get<EpisodeDetail>(
    `/admins/contents/${contentId}/episodes/${episodeId}`,
  );
  return response.data;
}

export interface CreateEpisodePayload {
  title: string;
  chapter: number;
}

/** 회차 생성(POST /admins/contents/:contentId/episodes). */
export async function createEpisode(contentId: number, payload: CreateEpisodePayload): Promise<void> {
  await apiClient.post(`/admins/contents/${contentId}/episodes`, payload);
}

/** 회차 수정(PUT /admins/contents/:contentId/episodes/:id). 변경된 필드만 보낸다. */
export interface UpdateEpisodePayload {
  title?: string;
  chapter?: number;
  status?: EpisodeStatus;
}

export async function updateEpisode(
  contentId: number,
  episodeId: number,
  payload: UpdateEpisodePayload,
): Promise<void> {
  await apiClient.put(`/admins/contents/${contentId}/episodes/${episodeId}`, payload);
}

/** 회차 스크립트(컷+대사) 업로드. id 있으면 기존 행 upsert, 없으면 신규. position 은 화면 순서대로 프론트에서 부여. */
export interface UploadScriptLineItem {
  id?: number;
  characterId: number;
  script: string;
  position: number;
  anchorY?: number;
  gapBeforeMs?: number;
}
export interface UploadScriptCutItem {
  id?: number;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  cropBox?: CropBox;
  holdMs?: number;
  position: number;
  lineItems: UploadScriptLineItem[];
}
export interface UploadScriptPayload {
  cutItems: UploadScriptCutItem[];
}

export async function uploadScript(
  contentId: number,
  episodeId: number,
  payload: UploadScriptPayload,
): Promise<void> {
  await apiClient.put(`/admins/contents/${contentId}/episodes/${episodeId}/script`, payload);
}
