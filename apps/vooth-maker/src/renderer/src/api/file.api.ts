import { apiRequest } from '../lib/apiClient'

export interface PresignInput {
  originalName: string
  mimeType: string
  size: number
  /** 키 접두사(소문자/숫자/`/_-`). 예: creators/avatar */
  prefix?: string
}

export interface PresignResult {
  fileId: number
  key: string
  /** S3 presigned PUT URL — 이 URL 로 바이너리를 직접 PUT 한다(Content-Type=mimeType 동일). */
  uploadUrl: string
  publicUrl: string
}

/** presigned PUT URL 발급. POST /creators/files/presign */
export function presignFile(input: PresignInput): Promise<PresignResult> {
  return apiRequest<PresignResult>('/creators/files/presign', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

/** presigned URL 로 S3 에 직접 PUT 업로드(인증 헤더 없이 raw fetch). File/Blob 모두 허용. */
export async function putToS3(uploadUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob
  })
  if (!res.ok) {
    throw new Error(`파일 업로드에 실패했습니다. (HTTP ${res.status})`)
  }
}

/**
 * 아바타 업로드 = presign → S3 PUT → fileId 반환.
 * 반환된 fileId 를 소유 도메인(creator.avatarFileId)에 넘기면 서버가 채택 확정(commit)한다.
 */
export async function uploadAvatar(file: File): Promise<number> {
  const presigned = await presignFile({
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    prefix: 'creators/avatar'
  })
  await putToS3(presigned.uploadUrl, file)
  return presigned.fileId
}
