import { apiRequest } from '../lib/apiClient'

export interface PresignResponse {
  fileId: number
  key: string
  uploadUrl: string
  publicUrl: string
}

/** presigned PUT URL 발급(성우). */
export function presignFile(body: { originalName: string; mimeType: string; size: number }): Promise<PresignResponse> {
  return apiRequest<PresignResponse>('/creators/files/presign', { method: 'POST', body: JSON.stringify(body) })
}

/** 업로드 완료 확정. */
export function commitFile(fileId: number): Promise<unknown> {
  return apiRequest(`/creators/files/${fileId}/commit`, { method: 'PUT' })
}
