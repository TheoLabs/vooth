import { apiRequest } from '../lib/apiClient'
import { presignFile, putToS3 } from './file.api'

/** 녹음 오디오 업로드 = presign → S3 PUT → fileId. 서버가 POST 시 commit(mime audio/) 한다. */
export async function uploadAudio(blob: Blob): Promise<number> {
  // codecs 등 파라미터 제거(예: 'audio/webm;codecs=opus' → 'audio/webm'). presign 검증/서명 일치용.
  const mimeType = (blob.type || 'audio/webm').split(';')[0].trim()
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
  // presign Content-Type 과 PUT Content-Type 이 일치하도록 정규화된 타입으로 재포장.
  const upload = new Blob([blob], { type: mimeType })
  const presigned = await presignFile({
    originalName: `recording.${ext}`,
    mimeType,
    size: upload.size,
    prefix: 'creators/recording'
  })
  await putToS3(presigned.uploadUrl, upload)
  return presigned.fileId
}

/**
 * 녹음 저장. POST /creators/episodes/:episodeId/cuts/:cutId/lines/:lineId
 * take 번호는 서버가 (lineId, castingId) 의 max+1 로 할당(≤3 검증). audioFileId 는 업로드로 얻는다.
 */
export function createRecording(
  episodeId: number,
  cutId: number,
  lineId: number,
  body: { audioFileId: number; durationMs: number }
): Promise<unknown> {
  return apiRequest(`/creators/episodes/${episodeId}/cuts/${cutId}/lines/${lineId}`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/** 녹음본 채택. PUT /creators/recordings/:recordingId/select (서버가 같은 라인의 기존 채택 해제). */
export function selectRecording(recordingId: number): Promise<unknown> {
  return apiRequest(`/creators/recordings/${recordingId}/select`, { method: 'PUT' })
}

/** 녹음본 삭제. DELETE /creators/recordings/:recordingId */
export function deleteRecording(recordingId: number): Promise<unknown> {
  return apiRequest(`/creators/recordings/${recordingId}`, { method: 'DELETE' })
}
