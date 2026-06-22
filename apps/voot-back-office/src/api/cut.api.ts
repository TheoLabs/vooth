import type { Anchor, CropBox } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

/** 컷에 속한 대사(라인). anchorMetadata 는 연출(vooth-tool) 값. */
export interface AdminLine {
  id: number;
  cutId: number;
  characterId: number;
  script: string;
  order: number;
  anchorMetadata: Anchor | null;
}

/** 컷 응답(AdminCutResponseDto). anchorY/gap/holdOverride 는 연출(vooth-tool) 값. */
export interface AdminCut {
  id: number;
  episodeId: number;
  order: number;
  imageFileId: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageCropBox: CropBox;
  anchorY: number | null;
  gap: number | null;
  holdOverride: number | null;
  /** 조인된 대사 목록 */
  lines: AdminLine[];
}

/** 컷 목록. GET /admins/episodes/:episodeId/cuts */
export async function fetchCuts(episodeId: number): Promise<PaginatedResponse<AdminCut>> {
  const res = await apiClient.get<PaginatedResponse<AdminCut>>(
    `/admins/episodes/${episodeId}/cuts`,
  );
  return res.data;
}

export interface CreateCutInput {
  order: number;
  imageFileId: number;
  imageWidth: number;
  imageHeight: number;
  imageCropBox: CropBox;
}

/** 컷 생성. POST /admins/episodes/:episodeId/cuts */
export async function createCut(episodeId: number, input: CreateCutInput): Promise<void> {
  await apiClient.post(`/admins/episodes/${episodeId}/cuts`, input);
}

export interface UpdateCutInput {
  order?: number;
  imageFileId?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageCropBox?: CropBox;
}

/** 컷 수정(부분). PUT /admins/episodes/:episodeId/cuts/:id */
export async function updateCut(
  episodeId: number,
  cutId: number,
  input: UpdateCutInput,
): Promise<void> {
  await apiClient.put(`/admins/episodes/${episodeId}/cuts/${cutId}`, input);
}

/** 컷 삭제. DELETE /admins/episodes/:episodeId/cuts/:id */
export async function deleteCut(episodeId: number, cutId: number): Promise<void> {
  await apiClient.delete(`/admins/episodes/${episodeId}/cuts/${cutId}`);
}

export interface CreateLineInput {
  characterId: number;
  script: string;
  order: number;
  // anchorMetadata 는 연출(vooth-tool) 영역이라 백오피스에서는 보내지 않는다.
}

/** 대사(라인) 등록. POST /admins/cuts/:cutId/lines */
export async function createLine(cutId: number, input: CreateLineInput): Promise<void> {
  await apiClient.post(`/admins/cuts/${cutId}/lines`, input);
}

export interface UpdateLineInput {
  characterId?: number;
  script?: string;
  order?: number;
}

/** 대사(라인) 수정(부분). PUT /admins/cuts/:cutId/lines/:lineId */
export async function updateLine(
  cutId: number,
  lineId: number,
  input: UpdateLineInput,
): Promise<void> {
  await apiClient.put(`/admins/cuts/${cutId}/lines/${lineId}`, input);
}

/** 대사(라인) 삭제. DELETE /admins/cuts/:cutId/lines/:lineId */
export async function deleteLine(cutId: number, lineId: number): Promise<void> {
  await apiClient.delete(`/admins/cuts/${cutId}/lines/${lineId}`);
}
