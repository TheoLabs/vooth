import { commitFile, presignFile } from '../api/files.api'

/**
 * blob 을 S3 에 업로드하고 공개 URL 을 반환한다.
 * presign(메타 등록) → uploadUrl 로 직접 PUT → commit(확정) → publicUrl.
 */
export async function uploadBlob(blob: Blob, originalName: string): Promise<string> {
  const mimeType = blob.type || 'application/octet-stream'
  const { fileId, uploadUrl, publicUrl } = await presignFile({ originalName, mimeType, size: blob.size })

  const res = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': mimeType } })
  if (!res.ok) {
    throw new Error(`오디오 업로드 실패 (HTTP ${res.status})`)
  }

  await commitFile(fileId)
  return publicUrl
}
