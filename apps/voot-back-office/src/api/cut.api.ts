import type { CropBox } from '@vooth/shared';
import { apiClient } from '../lib/apiClient';
import type { PaginatedResponse } from './pagination';

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

/** 컷 삭제. DELETE /admins/episodes/:episodeId/cuts/:id */
export async function deleteCut(episodeId: number, cutId: number): Promise<void> {
  await apiClient.delete(`/admins/episodes/${episodeId}/cuts/${cutId}`);
}
