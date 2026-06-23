import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEpisodeDetail } from '../domain/mockData'
import {
  CUT_EFFECT_COLOR,
  CUT_EFFECT_TYPE_LABEL,
  SOUND_EFFECT_COLOR,
  type EpisodeDetail
} from '../domain/types'
import { buildTimeline } from '../domain/timeline'
import { MockNote } from '../components/MockNote'
import { formatMs } from '../domain/format'
import './tool.css'
import './preview.css'

const STAGE_W = 300 // 미리보기 렌더 폭(px)
const VIEWPORT_RATIO = 1.6 // 세로/가로 (16:10 세로형 ≈ 1.6)

/**
 * 연속 스크롤 미리보기(webtoon-style). docs §15.2.
 * 컷 원본을 실제 높이 비율로 세로로 이어 붙인 캔버스를 스크롤하고,
 * 라인을 anchorY 위치에 오버레이한다. 타임라인의 각 라인 시작 시각에
 * 해당 앵커가 뷰포트 중앙에 오도록 scrollY 키프레임을 보간한다.
 */
export function EpisodePreviewPage(): React.JSX.Element {
  const { episodeId } = useParams()
  const navigate = useNavigate()
  const id = Number(episodeId)
  const detail = useMemo<EpisodeDetail>(() => getEpisodeDetail(id), [id])
  const charById = useMemo(() => new Map(detail.characters.map((c) => [c.id, c])), [detail])

  const orderedCuts = useMemo(
    () => [...detail.cuts].sort((a, b) => a.position - b.position),
    [detail]
  )

  // 캔버스 레이아웃: 컷별 렌더 높이(폭 STAGE_W 기준) + 상단 오프셋.
  const layout = useMemo(() => {
    const cuts: { cut: (typeof orderedCuts)[number]; top: number; height: number }[] = []
    let running = 0
    for (const cut of orderedCuts) {
      const height = (STAGE_W * cut.imageHeight) / cut.imageWidth
      cuts.push({ cut, top: running, height })
      running += height
    }
    return { cuts, totalHeight: running }
  }, [orderedCuts])

  const viewportH = STAGE_W * VIEWPORT_RATIO
  const maxScroll = Math.max(0, layout.totalHeight - viewportH)

  // 타임라인 → 라인 시작 시각 + 효과 해석.
  const timeline = useMemo(
    () => buildTimeline(orderedCuts, (e) => CUT_EFFECT_TYPE_LABEL[e.type]),
    [orderedCuts]
  )

  // 라인별 앵커 픽셀 + 시작 시각 키프레임.
  const keyframes = useMemo(() => {
    const kfs: { tMs: number; scrollY: number }[] = [{ tMs: 0, scrollY: 0 }]
    for (const cutSeg of timeline.cuts) {
      const entry = layout.cuts.find((c) => c.cut.id === cutSeg.cutId)
      if (!entry) continue
      const lines = [...entry.cut.lines].sort((a, b) => a.position - b.position)
      lines.forEach((line, i) => {
        const seg = cutSeg.lines.find((l) => l.lineId === line.id)
        if (!seg) return
        // anchorY null 이면 컷 내 균등 분배 폴백.
        const ay = line.anchorY ?? (i + 1) / (lines.length + 1)
        const anchorPx = entry.top + ay * entry.height
        const scrollY = Math.min(maxScroll, Math.max(0, anchorPx - viewportH / 2))
        kfs.push({ tMs: seg.startMs, scrollY })
      })
    }
    return kfs
  }, [timeline, layout, maxScroll, viewportH])

  const [tMs, setTMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    if (!playing) return
    lastRef.current = performance.now()
    const tick = (now: number): void => {
      const dt = now - lastRef.current
      lastRef.current = now
      setTMs((prev) => {
        const next = prev + dt
        if (next >= timeline.totalMs) {
          setPlaying(false)
          return timeline.totalMs
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, timeline.totalMs])

  // 현재 시각의 scrollY 를 키프레임 선형 보간으로 계산.
  const scrollY = useMemo(() => {
    if (keyframes.length === 0) return 0
    let prev = keyframes[0]
    for (let i = 1; i < keyframes.length; i++) {
      const kf = keyframes[i]
      if (tMs <= kf.tMs) {
        const span = kf.tMs - prev.tMs || 1
        const r = Math.min(1, Math.max(0, (tMs - prev.tMs) / span))
        // smoothstep 이징
        const e = r * r * (3 - 2 * r)
        return prev.scrollY + (kf.scrollY - prev.scrollY) * e
      }
      prev = kf
    }
    return prev.scrollY
  }, [tMs, keyframes])

  // 현재 시각에 활성인 효과(효과음·시각효과). docs §03 resolve 결과 기준.
  const activeEffects = useMemo(() => {
    const out: { key: string; kind: 'sound' | 'cut'; label: string }[] = []
    for (const cutSeg of timeline.cuts) {
      for (const es of cutSeg.effects) {
        if (tMs >= es.startMs && tMs < es.startMs + es.durationMs) {
          out.push({ key: `${es.kind}-${es.effectId}`, kind: es.kind, label: es.label })
        }
      }
    }
    return out
  }, [timeline, tMs])

  return (
    <div className="tool-page">
      <div>
        <button className="ed-back" onClick={() => navigate(`/episodes/${id}`)}>
          ← 연출 에디터
        </button>
        <div className="tool-page__head">
          <div>
            <h2 className="tool-page__title">연속 스크롤 미리보기</h2>
            <p className="tool-page__desc">
              컷을 실제 높이 비율로 이어 붙인 세로 캔버스. anchorY 기준으로 대사 시점에 스크롤됩니다.
            </p>
          </div>
          <MockNote text="MOCK 미리보기 — 길이는 추정 durationMs" />
        </div>
      </div>

      <div className="pv-wrap">
        <div className="pv-stage">
          <div className="pv-viewport" style={{ height: viewportH }}>
            <div
              className="pv-canvas"
              style={{ height: layout.totalHeight, transform: `translateY(${-scrollY}px)` }}
            >
              {layout.cuts.map(({ cut, height }) => {
                const lines = [...cut.lines].sort((a, b) => a.position - b.position)
                return (
                  <div key={cut.id} className="pv-cut" style={{ height }}>
                    <img className="pv-cut__img" src={cut.imageUrl} alt={`컷 ${cut.position}`} />
                    {lines.map((line, i) => {
                      const ay = line.anchorY ?? (i + 1) / (lines.length + 1)
                      const ch = charById.get(line.characterId)
                      return (
                        <div key={line.id} className="pv-overlay" style={{ top: `${ay * 100}%` }}>
                          <div className="pv-overlay__char" style={{ color: ch?.color }}>
                            {ch?.name ?? '미지정'}
                          </div>
                          {line.text}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <div className="pv-center-line" />
            {activeEffects.length > 0 && (
              <div className="pv-fx-overlay">
                {activeEffects.map((fx) => (
                  <span
                    key={fx.key}
                    className="pv-fx-badge"
                    style={{ background: fx.kind === 'sound' ? SOUND_EFFECT_COLOR : CUT_EFFECT_COLOR }}
                  >
                    {fx.kind === 'sound' ? '🔊' : '✦'} {fx.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pv-side">
          <div className="tool-card">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <button
                className="tool-btn tool-btn--primary"
                onClick={() => {
                  if (tMs >= timeline.totalMs) setTMs(0)
                  setPlaying((p) => !p)
                }}
              >
                {playing ? '⏸ 일시정지' : '▶ 재생'}
              </button>
              <button
                className="tool-btn"
                onClick={() => {
                  setPlaying(false)
                  setTMs(0)
                }}
              >
                ⏮ 처음으로
              </button>
              <span className="tool-count" style={{ marginLeft: 'auto' }}>
                {formatMs(tMs)} / {formatMs(timeline.totalMs)}
              </span>
            </div>
            <input
              className="pv-scrub"
              type="range"
              min={0}
              max={Math.round(timeline.totalMs)}
              value={Math.round(tMs)}
              onChange={(e) => {
                setPlaying(false)
                setTMs(Number(e.target.value))
              }}
            />
            <div className="tool-meta" style={{ marginTop: 16 }}>
              <div className="tool-meta__item">
                <span className="tool-meta__k">캔버스 높이</span>
                <span className="tool-meta__v">{Math.round(layout.totalHeight)}px</span>
              </div>
              <div className="tool-meta__item">
                <span className="tool-meta__k">뷰포트</span>
                <span className="tool-meta__v">
                  {STAGE_W}×{Math.round(viewportH)}
                </span>
              </div>
              <div className="tool-meta__item">
                <span className="tool-meta__k">컷 수</span>
                <span className="tool-meta__v">{orderedCuts.length}</span>
              </div>
              <div className="tool-meta__item">
                <span className="tool-meta__k">앵커 키프레임</span>
                <span className="tool-meta__v">{keyframes.length}</span>
              </div>
              <div className="tool-meta__item">
                <span className="tool-meta__k">효과(SFX·FX)</span>
                <span className="tool-meta__v">
                  {orderedCuts.reduce((n, c) => n + c.soundEffects.length + c.cutEffects.length, 0)}
                </span>
              </div>
            </div>

            <div className="pv-fx-now">
              <span className="tool-field__label">현재 활성 효과</span>
              {activeEffects.length === 0 ? (
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>없음</span>
              ) : (
                <div className="pv-fx-now__list">
                  {activeEffects.map((fx) => (
                    <span
                      key={fx.key}
                      className="pv-fx-badge"
                      style={{ background: fx.kind === 'sound' ? SOUND_EFFECT_COLOR : CUT_EFFECT_COLOR }}
                    >
                      {fx.kind === 'sound' ? '🔊' : '✦'} {fx.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
              스크롤 키프레임은 각 대사 시작 시각에 anchorY 픽셀을 뷰포트 중앙에 맞춰 smoothstep 보간합니다
              (anchorY 미지정 라인은 컷 내 균등 분배 폴백).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
