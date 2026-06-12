import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildPreviewTimeline,
  scrollUnitsAt,
  segmentAt,
  type PreviewTimeline
} from '../../lib/recording-timeline'
import { formatMs } from '../../lib/timeline'
import { MOCK_CHARACTERS } from '../../mocks/recording-domain.mock'
import type { Recording, RecordingEpisode } from '../../types/recording-domain'
import './ScrollPreview.css'

/** 컷 1장이 차지하는 뷰포트 높이(px). 스크롤 단위 = 이 높이. */
const FRAME_H = 460
/** 컷→컷 스크롤 전환에 쓰는 시간(ms). */
const TRANSITION_MS = 700

/**
 * 웹툰식 연속 세로 스크롤 미리보기(mock).
 *
 * 컷 이미지를 세로로 이어 붙인 트랙을 만들고, 녹음(durationMs)에서 유도한 타임라인에 맞춰
 * translateY 를 움직인다 — 컷 안에서는 머물고, 컷 끝 구간에서 다음 컷으로 스르륵 스크롤.
 * (오디오 합성/재생은 서버 업로드 이후 — 지금은 가상 클럭으로 스크롤만 구동.)
 */
export function ScrollPreview({
  episode,
  recordingsByLine,
  onClose
}: {
  episode: RecordingEpisode
  recordingsByLine: Record<number, Recording[]>
  onClose: () => void
}): React.JSX.Element {
  const timeline: PreviewTimeline = useMemo(
    () => buildPreviewTimeline(episode, recordingsByLine),
    [episode, recordingsByLine]
  )

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const rafRef = useRef<number | null>(null)
  const baseRef = useRef(0)

  // 가상 클럭(rAF). playing 동안 performance.now 기준으로 elapsed 갱신.
  useEffect(() => {
    if (!playing) return
    baseRef.current = performance.now() - elapsed
    const tick = (): void => {
      const e = performance.now() - baseRef.current
      if (e >= timeline.totalMs) {
        setElapsed(timeline.totalMs)
        setPlaying(false)
        return
      }
      setElapsed(e)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // elapsed 는 재생 시작 시점만 참조(의도) — deps 에서 제외.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, timeline.totalMs])

  // ESC 로 닫기.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const units = scrollUnitsAt(timeline, elapsed, TRANSITION_MS)
  const translateY = -units * FRAME_H
  const { line } = segmentAt(timeline, elapsed)
  const characterName = line ? (MOCK_CHARACTERS[line.characterId] ?? `캐릭터 #${line.characterId}`) : ''

  const togglePlay = useCallback((): void => {
    if (elapsed >= timeline.totalMs) setElapsed(0) // 끝났으면 처음부터
    setPlaying((p) => !p)
  }, [elapsed, timeline.totalMs])

  const restart = useCallback((): void => {
    setElapsed(0)
    setPlaying(true)
  }, [])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      setElapsed(ratio * timeline.totalMs)
    },
    [timeline.totalMs]
  )

  const progress = timeline.totalMs > 0 ? (elapsed / timeline.totalMs) * 100 : 0

  return (
    <div className="sp" role="dialog" aria-modal="true">
      <div className="sp__backdrop" onClick={onClose} />
      <div className="sp__panel">
        <div className="sp__topbar">
          <span className="sp__title">
            미리보기 · {episode.chapter}화 {episode.title}
          </span>
          <button type="button" className="sp__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 세로 스크롤 무대 */}
        <div className="sp__stage" style={{ height: FRAME_H }}>
          <div className="sp__track" style={{ transform: `translateY(${translateY}px)` }}>
            {timeline.cuts.map((c) => (
              <div className="sp__frame" key={c.cutId} style={{ height: FRAME_H }}>
                <img className="sp__img" src={c.imageUrl} alt={`컷 ${c.index + 1}`} />
                <span className="sp__cut-no">컷 {c.index + 1}</span>
              </div>
            ))}
          </div>

          {/* 자막(현재 라인) */}
          {line && (
            <div className="sp__caption">
              {characterName && <span className="sp__caption-name">{characterName}</span>}
              <span className="sp__caption-text">{line.script}</span>
              {!line.resolved && <span className="sp__caption-mock">미녹음(placeholder)</span>}
            </div>
          )}
        </div>

        {/* 컨트롤 */}
        <div className="sp__controls">
          <button type="button" className="sp__play" onClick={togglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className="sp__restart" onClick={restart} title="처음부터">
            ↺
          </button>
          <span className="sp__time">{formatMs(elapsed)}</span>
          <div className="sp__bar" onClick={seek}>
            <div className="sp__bar-fill" style={{ width: `${progress}%` }} />
            {/* 컷 경계 마커 */}
            {timeline.cuts.slice(1).map((c) => (
              <span
                key={c.cutId}
                className="sp__bar-tick"
                style={{ left: `${(c.start / timeline.totalMs) * 100}%` }}
              />
            ))}
          </div>
          <span className="sp__time">{formatMs(timeline.totalMs)}</span>
        </div>

        <p className="sp__note">
          ⚠️ mock 미리보기 — 스크롤 타이밍은 녹음 길이(durationMs)에서 유도. 미녹음 대사는 {formatMs(1500)}{' '}
          placeholder. 오디오 재생은 서버 업로드 이후 연결.
        </p>
      </div>
    </div>
  )
}
