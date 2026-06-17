import { apiClient } from '../lib/apiClient';

export interface PresignResult {
  fileId: number;
  key: string;
  uploadUrl: string;
  publicUrl: string;
}

/** presigned PUT URL 발급. POST /admins/files/presign */
export async function presignFile(input: {
  originalName: string;
  mimeType: string;
  size: number;
  prefix?: string;
}): Promise<PresignResult> {
  const res = await apiClient.post<PresignResult>('/admins/files/presign', input);
  return res.data;
}

/**
 * 이미지 업로드 = presign → S3 PUT → fileId 반환.
 * 반환된 fileId 를 소유 도메인(content.thumbnailFileId 등)에 넘기면 서버가 채택 확정(commit)한다.
 */
export async function uploadImage(file: File, prefix = 'contents/thumbnail'): Promise<number> {
  const presigned = await presignFile({
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    prefix,
  });
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`파일 업로드에 실패했습니다. (HTTP ${res.status})`);
  }
  return presigned.fileId;
}
