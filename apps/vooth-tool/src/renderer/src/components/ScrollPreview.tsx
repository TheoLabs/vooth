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
 * 검수용 연속 스크롤 미리보기 — anchorY 스크롤 + 라인별 채택 take 오디오 동기 재생.
 * 패널 높이는 자기 화면상 top 기준으로 뷰포트 바닥까지 채운다.
 */
export function ScrollPreview({
  cuts,
  audioByLine
}: {
  cuts: ScrollInputCut[]
  audioByLine: Record<number, string>
}): React.JSX.Element {
  // 패널 높이(바닥까지). 마운트/리사이즈에서만 측정 — 페이지 스크롤 시엔 재계산하지 않아야
  // 내부 스크롤 콘텐츠가 같이 움직이지 않는다(패널은 sticky 로만 따라옴).
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelH, setPanelH] = useState(600)
  useEffect(() => {
    const update = (): void => {
      const el = panelRef.current
      if (!el) return
      setPanelH(Math.max(240, window.innerHeight - el.getBoundingClientRect().top - 12))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // stage 실제 높이 측정.
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
    () => buildScrollTimeline(cuts, { renderW: RENDER_W, viewportH: stageH }),
    [cuts, stageH]
  )

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const baseRef = useRef(0)

  // 오디오 동기: 현재 라인이 바뀌면 그 라인의 채택 오디오를 재생.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingLineRef = useRef<number | null>(null)
  const stopAudio = useCallback((): void => {
    audioRef.current?.pause()
    audioRef.current = null
    playingLineRef.current = null
  }, [])

  const syncAudio = useCallback(
    (e: number): void => {
      const line = lineAt(timeline, e)
      const lineId = line?.id ?? null
      if (lineId === playingLineRef.current) return
      audioRef.current?.pause()
      audioRef.current = null
      playingLineRef.current = lineId
      const url = lineId != null ? audioByLine[lineId] : undefined
      if (!url || !line) return
      const audio = new Audio(url)
      audio.currentTime = Math.max(0, (e - line.start) / 1000)
      audioRef.current = audio
      void audio.play().catch(() => {})
    },
    [timeline, audioByLine]
  )

  useEffect(() => {
    if (!playing) {
      stopAudio()
      return
    }
    baseRef.current = performance.now() - elapsed
    const tick = (): void => {
      const e = performance.now() - baseRef.current
      if (e >= timeline.totalMs) {
        setElapsed(timeline.totalMs)
        setPlaying(false)
        stopAudio()
        return
      }
      setElapsed(e)
      syncAudio(e)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, timeline.totalMs])

  useEffect(() => () => stopAudio(), [stopAudio])

  const scrollY = scrollYAt(timeline, elapsed)
  const line = lineAt(timeline, elapsed)

  const toggle = useCallback(() => {
    if (elapsed >= timeline.totalMs) setElapsed(0)
    setPlaying((p) => !p)
  }, [elapsed, timeline.totalMs])

  const restart = useCallback(() => {
    stopAudio()
    setElapsed(0)
    setPlaying(true)
  }, [stopAudio])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      stopAudio()
      setElapsed(ratio * timeline.totalMs)
    },
    [timeline.totalMs, stopAudio]
  )

  const progress = timeline.totalMs > 0 ? (elapsed / timeline.totalMs) * 100 : 0

  return (
    <div className="sp-panel" ref={panelRef} style={{ height: panelH }}>
      <div className="sp__topbar">
        <span>검수 · 연속 스크롤</span>
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

      <p className="sp__note">채택 take 오디오 동기 재생. 미채택 라인은 무음(placeholder 길이).</p>
    </div>
  )
}
