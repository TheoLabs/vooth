import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildScrollTimeline,
  lineAt,
  scrollYAt,
  type ScrollInputCut,
  type ScrollTimeline
} from '../lib/scrollTimeline'
import { FRAME_RATIO } from '../lib/cropBox'
import './ScrollPreview.css'

const RENDER_W = 320

/** 컷의 렌더 높이(원본 비율, 크기 미상이면 16:10). */
function cutRenderHeight(cut: ScrollInputCut): number {
  if (cut.imageWidth && cut.imageHeight) return (RENDER_W * cut.imageHeight) / cut.imageWidth
  return RENDER_W / FRAME_RATIO
}

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
  // 뷰포트는 "가장 짧은 컷보다 작게" 잡아야 모든 컷(특히 컷1)이 중앙에 잡힌다.
  // 뷰포트가 컷보다 크면 초반 앵커가 clamp(0) 돼서 컷1 이 스킵된 것처럼 보임.
  const viewportH = useMemo(() => {
    const heights = cuts.map(cutRenderHeight)
    const minH = heights.length ? Math.min(...heights) : 400
    // 항상 가장 짧은 컷보다 작게(0.85배) — 단 절대 상·하한.
    return Math.max(120, Math.min(440, Math.round(minH * 0.85)))
  }, [cuts])

  const timeline: ScrollTimeline = useMemo(
    () => buildScrollTimeline(cuts, { renderW: RENDER_W, viewportH }),
    [cuts, viewportH]
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

        <div className="sp__stage" style={{ width: RENDER_W, height: viewportH }}>
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
