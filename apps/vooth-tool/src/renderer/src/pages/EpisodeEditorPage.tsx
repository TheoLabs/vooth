import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEpisodeDetail } from '../domain/mockData'
import {
  CUT_EFFECT_COLOR,
  CUT_TRANSITION_LABEL,
  CutTransition,
  EPISODE_STATUS_LABEL,
  SOUND_EFFECT_COLOR,
  type Cut,
  type CutEffect,
  type EpisodeDetail,
  type Line,
  type SoundEffect
} from '../domain/types'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { AnchorView } from '../components/AnchorView'
import { TimelineStrip } from '../components/TimelineStrip'
import { EffectEditor } from '../components/EffectEditor'
import { EPISODE_STATUS_BADGE, formatGap } from '../domain/format'
import './tool.css'
import './editor.css'

/**
 * 연출 에디터(핵심) — Final Cut 스타일 NLE 레이아웃.
 * 상단 바 + (뷰어 | 인스펙터) + 하단 고정 타임라인 도크.
 * 타임라인에서 컷을 클릭해 선택하면 뷰어/인스펙터가 그 컷으로 바뀐다.
 * - 컷: anchorY 시각화 + holdMs + transition + 효과(효과음/시각효과)
 * - 라인: 화자·대사(read-only) + gapBeforeMs(음수=겹침)
 * - 대사 앵커(anchorY) 편집은 별도 화면(EpisodeAnchorPage)으로 분리됨.
 * 편집은 로컬 state(mock). 저장 시 directors/* PUT 으로 변경분만 전송 예정.
 */
export function EpisodeEditorPage(): React.JSX.Element {
  const { episodeId } = useParams()
  const navigate = useNavigate()
  const id = Number(episodeId)

  // mock 상세를 로컬 편집 state 로 복제.
  const initial = useMemo<EpisodeDetail>(() => getEpisodeDetail(id), [id])
  const [cuts, setCuts] = useState<Cut[]>(() =>
    initial.cuts.map((c) => ({
      ...c,
      lines: c.lines.map((l) => ({ ...l })),
      soundEffects: c.soundEffects.map((s) => ({ ...s })),
      cutEffects: c.cutEffects.map((e) => ({ ...e }))
    }))
  )
  const [dirty, setDirty] = useState(false)

  const orderedCuts = useMemo(() => [...cuts].sort((a, b) => a.position - b.position), [cuts])
  const [selectedCutId, setSelectedCutId] = useState<number | null>(
    () => orderedCuts[0]?.id ?? null
  )
  const selectedCut = cuts.find((c) => c.id === selectedCutId) ?? orderedCuts[0] ?? null

  const charById = useMemo(() => {
    const m = new Map(initial.characters.map((c) => [c.id, c]))
    return m
  }, [initial.characters])

  const characterColor = (cid: number): string => charById.get(cid)?.color ?? '#94a3b8'

  /** 앵커 target picker 라벨: "캐릭터명: 대사 앞부분". */
  const lineLabel = (line: Line): string => {
    const name = charById.get(line.characterId)?.name ?? '미지정'
    const snippet = line.text.length > 12 ? `${line.text.slice(0, 12)}…` : line.text
    return `${name}: ${snippet}`
  }

  const updateCut = (cutId: number, patch: Partial<Cut>): void => {
    setCuts((prev) => prev.map((c) => (c.id === cutId ? { ...c, ...patch } : c)))
    setDirty(true)
  }
  const updateLineGap = (cutId: number, lineId: number, gap: number): void => {
    setCuts((prev) =>
      prev.map((c) =>
        c.id !== cutId
          ? c
          : { ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, gapBeforeMs: gap } : l)) }
      )
    )
    setDirty(true)
  }
  const setSoundEffects = (cutId: number, next: SoundEffect[]): void => {
    setCuts((prev) => prev.map((c) => (c.id === cutId ? { ...c, soundEffects: next } : c)))
    setDirty(true)
  }
  const setCutEffects = (cutId: number, next: CutEffect[]): void => {
    setCuts((prev) => prev.map((c) => (c.id === cutId ? { ...c, cutEffects: next } : c)))
    setDirty(true)
  }
  /** 타임라인에서 효과 블록 끝을 드래그해 길이(ms) 조절. */
  const updateEffectDuration = (
    kind: 'sound' | 'cut',
    cutId: number,
    effectId: number,
    durationMs: number
  ): void => {
    setCuts((prev) =>
      prev.map((c) => {
        if (c.id !== cutId) return c
        if (kind === 'sound') {
          return {
            ...c,
            soundEffects: c.soundEffects.map((s) =>
              s.id === effectId ? { ...s, audioDuration: durationMs } : s
            )
          }
        }
        return {
          ...c,
          cutEffects: c.cutEffects.map((e) =>
            e.id === effectId ? { ...e, duration: durationMs } : e
          )
        }
      })
    )
    setDirty(true)
  }

  const badge = EPISODE_STATUS_BADGE[initial.status]

  // ── 하단 타임라인 도크: 드래그로 높이 조절(localStorage 유지) ──
  const DOCK_MIN = 120
  const DOCK_MAX = 600
  const [dockHeight, setDockHeight] = useState<number>(() => {
    const saved = Number(localStorage.getItem('vooth-tool.dockHeight'))
    return saved >= DOCK_MIN && saved <= DOCK_MAX ? saved : 200
  })
  // 드래그 중 등록한 정리 함수(언마운트 시 호출).
  const cleanupRef = useRef<(() => void) | null>(null)

  const onResizeStart = (e: React.MouseEvent): void => {
    e.preventDefault()
    const startY = e.clientY
    const startH = dockHeight

    const onMove = (ev: MouseEvent): void => {
      // 위로 드래그(=clientY 감소)하면 도크가 커진다.
      setDockHeight(Math.min(DOCK_MAX, Math.max(DOCK_MIN, startH + (startY - ev.clientY))))
    }
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      cleanupRef.current = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
    cleanupRef.current = onUp
  }

  useEffect(() => {
    localStorage.setItem('vooth-tool.dockHeight', String(dockHeight))
  }, [dockHeight])

  // 드래그 도중 언마운트되면 전역 리스너/스타일 정리.
  useEffect(() => () => cleanupRef.current?.(), [])

  // 도크 높이에서 크롬(핸들/라벨/레전드/패딩)을 빼고 3 레인에 분배 → 레인 높이.
  const laneHeight = Math.min(90, Math.max(18, Math.round((dockHeight - 104) / 3)))

  return (
    <div className="ed-workspace">
      {/* ── 상단 바 ── */}
      <header className="ed-topbar">
        <button className="ed-back" onClick={() => navigate('/episodes')}>
          ← 작업 목록
        </button>
        <div className="ed-topbar__title">
          <h2 className="ed-topbar__name">
            {initial.contentTitle} · {initial.episodeNo}화{' '}
            <span className="ed-topbar__sub">{initial.title}</span>
          </h2>
          <div className="ed-topbar__meta">
            <Badge label={EPISODE_STATUS_LABEL[initial.status]} {...badge} />
            <span className="ed-topbar__count">
              컷 {cuts.length} · 대사 {cuts.reduce((n, c) => n + c.lines.length, 0)}
            </span>
          </div>
        </div>
        <div className="ed-topbar__actions">
          <MockNote />
          <button className="tool-btn" onClick={() => navigate(`/episodes/${id}/adopt`)} title="채택 화면">
            채택
          </button>
          <button className="tool-btn" onClick={() => navigate(`/episodes/${id}/preview`)}>
            미리보기
          </button>
          <button
            className="tool-btn tool-btn--primary"
            disabled={!dirty}
            onClick={() => {
              setDirty(false)
              window.alert('연출값 저장(mock). 실제로는 변경된 컷/라인만 directors/* PUT 전송.')
            }}
          >
            {dirty ? '연출 저장' : '저장됨'}
          </button>
        </div>
      </header>

      {/* ── 뷰어 | 인스펙터 ── */}
      <div className="ed-main">
        <section className="ed-viewer">
          {selectedCut ? (
            <>
              <div className="ed-viewer__head">
                <span className="ed-cut__no">{selectedCut.position}</span>
                <strong>컷 {selectedCut.position}</strong>
                <span className="ed-viewer__dim">
                  {selectedCut.imageWidth}×{selectedCut.imageHeight}
                </span>
                {selectedCut.soundEffects.length > 0 && (
                  <span className="ed-fx-chip" style={{ color: SOUND_EFFECT_COLOR, borderColor: SOUND_EFFECT_COLOR }}>
                    🔊 {selectedCut.soundEffects.length}
                  </span>
                )}
                {selectedCut.cutEffects.length > 0 && (
                  <span className="ed-fx-chip" style={{ color: CUT_EFFECT_COLOR, borderColor: CUT_EFFECT_COLOR }}>
                    ✦ {selectedCut.cutEffects.length}
                  </span>
                )}
              </div>
              <div className="ed-viewer__media">
                <AnchorView
                  imageUrl={selectedCut.imageUrl}
                  anchors={selectedCut.lines.map((l) => ({
                    id: l.id,
                    anchorY: l.anchorY,
                    color: characterColor(l.characterId)
                  }))}
                />
              </div>
            </>
          ) : (
            <div className="ed-empty">컷이 없습니다. (컷·대사 등록은 back-office)</div>
          )}
        </section>

        <aside className="ed-inspector">
          {selectedCut ? (
            <>
              <div className="ed-inspector__section">
                <div className="ed-inspector__title">컷 연출</div>
                <div className="ed-cut__controls">
                  <div className="tool-field">
                    <span className="tool-field__label">hold (ms) — 마지막 대사 뒤 머무름</span>
                    <input
                      type="number"
                      className="tool-input"
                      style={{ width: 140 }}
                      value={selectedCut.holdMs}
                      min={0}
                      step={100}
                      onChange={(e) => updateCut(selectedCut.id, { holdMs: Number(e.target.value) })}
                    />
                  </div>
                  <div className="tool-field">
                    <span className="tool-field__label">transition (전환)</span>
                    <select
                      className="tool-select"
                      style={{ width: 140 }}
                      value={selectedCut.transition}
                      onChange={(e) =>
                        updateCut(selectedCut.id, { transition: e.target.value as CutTransition })
                      }
                    >
                      {Object.values(CutTransition).map((t) => (
                        <option key={t} value={t}>
                          {CUT_TRANSITION_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="ed-inspector__section">
                <div className="ed-inspector__title">
                  대사 ({selectedCut.lines.length}){' '}
                  <span className="ed-inspector__hint">앵커(anchorY)는 “앵커 설정” 화면에서</span>
                </div>
                <div className="ed-lines">
                  {[...selectedCut.lines]
                    .sort((a, b) => a.position - b.position)
                    .map((line) => {
                      const ch = charById.get(line.characterId)
                      return (
                        <div
                          key={line.id}
                          className={`ed-line${line.gapBeforeMs < 0 ? ' ed-line--overlap' : ''}`}
                        >
                          <div className="ed-line__char">
                            <span
                              className="ed-line__dot"
                              style={{ background: ch?.color ?? '#94a3b8' }}
                            />
                            {ch?.name ?? '미지정'}
                          </div>
                          <div className="ed-line__text">{line.text}</div>
                          <div className="ed-line__controls">
                            <div className="tool-field">
                              <span className="tool-field__label">gap (ms, 음수=겹침)</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                  type="number"
                                  className="tool-input tool-input--sm"
                                  style={{ width: 96 }}
                                  value={line.gapBeforeMs}
                                  step={50}
                                  onChange={(e) =>
                                    updateLineGap(selectedCut.id, line.id, Number(e.target.value))
                                  }
                                />
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: line.gapBeforeMs < 0 ? 'var(--vt-danger)' : 'var(--vt-text-dim)'
                                  }}
                                >
                                  {formatGap(line.gapBeforeMs)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  {selectedCut.lines.length === 0 && <div className="ed-fx-empty">대사 없음</div>}
                </div>
              </div>

              <div className="ed-inspector__section">
                <div className="ed-inspector__title">효과 (효과음 · 시각효과)</div>
                <EffectEditor
                  cut={selectedCut}
                  lineLabel={lineLabel}
                  onChangeSoundEffects={(next) => setSoundEffects(selectedCut.id, next)}
                  onChangeCutEffects={(next) => setCutEffects(selectedCut.id, next)}
                />
              </div>
            </>
          ) : (
            <div className="ed-empty">컷을 선택하세요.</div>
          )}
        </aside>
      </div>

      {/* ── 하단 고정 타임라인 도크(드래그로 높이 조절) ── */}
      <div className="ed-dock" style={{ height: dockHeight }}>
        <div
          className="ed-dock__handle"
          onMouseDown={onResizeStart}
          onDoubleClick={() => setDockHeight(200)}
          role="separator"
          aria-orientation="horizontal"
          title="드래그로 타임라인 높이 조절 · 더블클릭으로 초기화"
        />
        <div className="ed-dock__label">타임라인</div>
        <div className="ed-dock__scroll">
          <TimelineStrip
            cuts={cuts}
            characterColor={characterColor}
            selectedCutId={selectedCut?.id ?? null}
            onSelectCut={setSelectedCutId}
            onLineGap={updateLineGap}
            onEffectDuration={updateEffectDuration}
            laneHeight={laneHeight}
          />
        </div>
      </div>
    </div>
  )
}
