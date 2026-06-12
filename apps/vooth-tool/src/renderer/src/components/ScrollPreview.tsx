import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildScrollTimeline,
  lineAt,
  scrollYAt,
  type ScrollInputCut,
  type ScrollTimeline
} from '../lib/scrollTimeline'
import './ScrollPreview.css'

const RENDER_W = 300
const VIEWPORT_H = 500

function fmt(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * 연출 연속 세로 스크롤 미리보기(anchorY 소비). 원본을 이어 붙인 캔버스를
 * anchorY 키프레임으로 스크롤. 라인 길이는 placeholder(실 녹음 전).
 */
export function ScrollPreview({
  cuts,
  onClose
}: {
  cuts: ScrollInputCut[]
  onClose: () => void
}): React.JSX.Element {
  const timeline: ScrollTimeline = useMemo(
    () => buildScrollTimeline(cuts, { renderW: RENDER_W, viewportH: VIEWPORT_H }),
    [cuts]
  )

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const rafRef = useRef<number | null>(null)
  const baseRef = useRef(0)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, timeline.totalMs])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const scrollY = scrollYAt(timeline, elapsed)
  const line = lineAt(timeline, elapsed)

  const toggle = useCallback(() => {
    if (elapsed >= timeline.totalMs) setElapsed(0)
    setPlaying((p) => !p)
  }, [elapsed, timeline.totalMs])

  const restart = useCallback(() => {
    setElapsed(0)
    setPlaying(true)
  }, [])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
          <span>연속 스크롤 미리보기</span>
          <button type="button" className="sp__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sp__stage" style={{ width: RENDER_W, height: VIEWPORT_H }}>
          <div className="sp__track" style={{ transform: `translateY(${-scrollY}px)` }}>
            {timeline.cuts.map((cut, i) => (
              <div className="sp__frame" key={i} style={{ height: cut.height }}>
                {cut.imageUrl && <img className="sp__img" src={cut.imageUrl} alt={`컷 ${i + 1}`} draggable={false} />}
              </div>
            ))}
          </div>
          <div className="sp__centerline" />
          {line && (
            <div className="sp__caption">
              <span className="sp__caption-name">{line.characterName}</span>
              <span className="sp__caption-text">{line.script}</span>
            </div>
          )}
        </div>

        <div className="sp__controls">
          <button type="button" className="sp__btn" onClick={toggle}>
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className="sp__btn sp__btn--ghost" onClick={restart} title="처음부터">
            ↺
          </button>
          <span className="sp__time">{fmt(elapsed)}</span>
          <div className="sp__bar" onClick={seek}>
            <div className="sp__bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="sp__time">{fmt(timeline.totalMs)}</span>
        </div>

        <p className="sp__note">⚠️ mock — 라인 길이는 placeholder. 실제 영상은 채택 take 의 durationMs 로 계산.</p>
      </div>
    </div>
  )
}
