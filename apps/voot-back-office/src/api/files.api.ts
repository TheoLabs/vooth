import { apiClient } from '../lib/apiClient';

export interface PresignResult {
  fileId: number;
  key: string;
  uploadUrl: string;
  publicUrl: string;
}

export interface PresignPayload {
  originalName: string;
  mimeType: string;
  size: number;
}

/** presigned 업로드 URL 발급(POST /admins/files/presign). File 레코드는 PENDING 으로 생성된다. */
export async function presignFile(payload: PresignPayload): Promise<PresignResult> {
  const response = await apiClient.post<PresignResult>('/admins/files/presign', payload);
  return response.data;
}

/** 업로드 확정(PUT /admins/files/:id/commit). isCommit=true. */
export async function commitFile(fileId: number): Promise<void> {
  await apiClient.put(`/admins/files/${fileId}/commit`);
}

/**
 * presigned URL 로 S3 에 직접 PUT 업로드한다.
 * apiClient(Bearer/인터셉터) 가 아니라 fetch 로 서명 URL 에 그대로 보낸다.
 * Content-Type 은 presign 시 지정한 값과 동일해야 서명이 맞다.
 */
async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error('파일 업로드에 실패했습니다.');
  }
}

/**
 * presign → S3 업로드 → commit 을 순서대로 수행하고 결과(publicUrl 등)를 반환한다.
 * 업로드 성공 콜백으로 commit 을 즉시 보낸다.
 */
export async function uploadViaPresign(file: File): Promise<PresignResult> {
  const presigned = await presignFile({ originalName: file.name, mimeType: file.type, size: file.size });
  await uploadToS3(presigned.uploadUrl, file);
  await commitFile(presigned.fileId);
  return presigned;
}
