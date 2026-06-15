import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildScrollTimeline,
  lineAt,
  scrollYAt,
  type ScrollInputCut,
  type ScrollTimeline
} from '../lib/scrollTimeline'
import './ScrollPreview.css'

const RENDER_W = 460

function fmt(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * anchorY 연속 세로 스크롤 미리보기(임베드형, sticky 패널). 라인 길이는 실제 녹음 durationMs.
 */
export function ScrollPreview({ cuts }: { cuts: ScrollInputCut[] }): React.JSX.Element {
  // 컷에 imageWidth/Height 가 없으면(미저장) 이미지 실제 크기를 측정해 진짜 비율을 쓴다.
  const [measured, setMeasured] = useState<Record<string, { w: number; h: number }>>({})
  useEffect(() => {
    for (const c of cuts) {
      if (!c.imageUrl || (c.imageWidth && c.imageHeight) || measured[c.imageUrl]) continue
      const url = c.imageUrl
      const img = new Image()
      img.onload = () =>
        setMeasured((prev) => (prev[url] ? prev : { ...prev, [url]: { w: img.naturalWidth, h: img.naturalHeight } }))
      img.src = url
    }
  }, [cuts, measured])

  // 측정값으로 dims 를 채운 컷.
  const effectiveCuts = useMemo<ScrollInputCut[]>(
    () =>
      cuts.map((c) => {
        if (c.imageWidth && c.imageHeight) return c
        const m = c.imageUrl ? measured[c.imageUrl] : undefined
        return m ? { ...c, imageWidth: m.w, imageHeight: m.h } : c
      }),
    [cuts, measured]
  )

  // 패널 높이: 자기 화면상 top 기준으로 "뷰포트 바닥까지" 채운다(앱 헤더/패딩/스크롤 위치 무관).
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelH, setPanelH] = useState(600)
  useEffect(() => {
    const update = (): void => {
      const el = panelRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      setPanelH(Math.max(240, window.innerHeight - top - 12))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [])

  // stage(뷰포트)는 패널이 flex 로 채운 실제 높이를 측정해 쓴다 → 컨트롤이 잘리지 않음.
  // 컷보다 커도 됨(컷1 은 리드인으로 처리). 스크롤 양은 캔버스 총높이로 결정.
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageH, setStageH] = useState(420)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height
      if (h && h > 0) setStageH(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const timeline: ScrollTimeline = useMemo(
    () => buildScrollTimeline(effectiveCuts, { renderW: RENDER_W, viewportH: stageH }),
    [effectiveCuts, stageH]
  )

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
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
    <div className="sp-panel" ref={panelRef} style={{ height: panelH }}>
      <div className="sp__topbar">
        <span>연속 스크롤 미리보기</span>
      </div>

      <div className="sp__stage" ref={stageRef}>
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

      <p className="sp__note">라인 길이는 채택/대표 take 의 durationMs 기준(없으면 placeholder).</p>
    </div>
  )
}
