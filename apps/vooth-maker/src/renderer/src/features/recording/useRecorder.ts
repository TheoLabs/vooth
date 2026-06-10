/**
 * 대사별 녹음 훅 (MediaRecorder 기반).
 *
 * - `navigator.mediaDevices.getUserMedia({ audio: true })` 로 마이크 스트림을 얻고
 *   Web `MediaRecorder` 로 녹음한다.
 * - 정지 시 audio/webm `Blob` + `URL.createObjectURL` objectURL 을 만든다.
 * - durationMs 는 webm 의 `<audio>.duration` 이 Infinity 인 경우가 많으므로
 *   시작~정지 경과시간(performance.now())으로 측정한다.
 * - getUserMedia 실패(권한 거부 등)는 `error` 로 노출한다.
 *
 * 주의: 녹음 결과(Blob/objectURL)는 세션 로컬이며 백엔드 업로드는 아직 없다.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** 녹음 1건의 결과. */
export interface RecorderResult {
  blob: Blob
  url: string
  durationMs: number
}

export interface UseRecorder {
  isRecording: boolean
  /** getUserMedia/MediaRecorder 관련 사용자 표시용 에러 메시지. 정상 시 null. */
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<RecorderResult>
}

const MIME_TYPE = 'audio/webm'

export function useRecorder(): UseRecorder {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)

  /** 마이크 스트림 트랙 정리. */
  const stopStream = useCallback((): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async (): Promise<void> => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 환경에서는 마이크 녹음을 사용할 수 없습니다.')
      throw new Error('getUserMedia unsupported')
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      const msg =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? '마이크 권한이 거부되었습니다. 시스템/앱 설정에서 마이크 접근을 허용해 주세요.'
          : name === 'NotFoundError'
            ? '사용 가능한 마이크를 찾을 수 없습니다.'
            : '마이크를 시작하지 못했습니다.'
      setError(msg)
      throw err instanceof Error ? err : new Error(msg)
    }

    streamRef.current = stream
    chunksRef.current = []

    // 일부 환경은 audio/webm 을 지원하지 않을 수 있으므로 안전하게 분기.
    const supported =
      typeof MediaRecorder !== 'undefined' &&
      typeof MediaRecorder.isTypeSupported === 'function' &&
      MediaRecorder.isTypeSupported(MIME_TYPE)
    const recorder = supported
      ? new MediaRecorder(stream, { mimeType: MIME_TYPE })
      : new MediaRecorder(stream)

    recorder.ondataavailable = (e: BlobEvent): void => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorderRef.current = recorder
    startedAtRef.current = performance.now()
    recorder.start()
    setIsRecording(true)
  }, [])

  const stop = useCallback((): Promise<RecorderResult> => {
    return new Promise<RecorderResult>((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder) {
        reject(new Error('녹음이 시작되지 않았습니다.'))
        return
      }

      recorder.onstop = (): void => {
        const durationMs = Math.round(performance.now() - startedAtRef.current)
        const blob = new Blob(chunksRef.current, { type: MIME_TYPE })
        const url = URL.createObjectURL(blob)

        chunksRef.current = []
        recorderRef.current = null
        stopStream()
        setIsRecording(false)

        resolve({ blob, url, durationMs })
      }

      recorder.stop()
    })
  }, [stopStream])

  // 언마운트 시 진행 중 녹음/스트림 정리(누수 방지).
  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop()
        }
      } catch {
        // 이미 정지된 경우 무시
      }
      stopStream()
    }
  }, [stopStream])

  return { isRecording, error, start, stop }
}
