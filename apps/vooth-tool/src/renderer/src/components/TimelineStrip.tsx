import type { Cut } from '../domain/types'
import { CUT_EFFECT_COLOR, CUT_EFFECT_TYPE_LABEL, SOUND_EFFECT_COLOR } from '../domain/types'
import { buildTimeline } from '../domain/timeline'
import { formatMs } from '../domain/format'

/**
 * 풀 앵커로 해석한 컷 타임라인을 3 레인(대사/효과음/시각효과)으로 시각화한다.
 * docs/domains/playback/index.html §03 의 "성우A 해석 결과" 다중 레인 그림을 본뜸.
 * 각 세그먼트는 resolve 된 startMs 에 절대 배치(겹침/오버랩이 시각적으로 드러남).
 *
 * Final Cut 스타일 에디터에선 이 strip 이 네비게이션 + 직접 편집 면이 된다:
 * - onSelectCut: 컷 밴드/블록 클릭으로 선택(selectedCutId 강조).
 * - onLineGap: 대사 블록을 좌우로 드래그해 gapBeforeMs(앞 여백/겹침)를 직접 조절.
 * - onEffectDuration: 효과(효과음/시각효과) 블록의 오른쪽 끝을 드래그해 길이 조절.
 */
const PX_PER_MS = 0.06 // 스케일(1px ≈ 16.7ms)
const DEFAULT_LANE_H = 22
const LANE_GAP = 4
const SNAP_MS = 10 // 드래그 스냅 단위
const MIN_EFFECT_MS = 50

const snap = (ms: number): number => Math.round(ms / SNAP_MS) * SNAP_MS

/** 전역 드래그 헬퍼: px 이동 → onMove(deltaMs). 클릭(미이동) 시 onClick. */
function beginDrag(
  e: React.MouseEvent,
  cursor: string,
  onMove: (deltaMs: number) => void,
  onClick?: () => void
): void {
  e.preventDefault()
  e.stopPropagation()
  const startX = e.clientX
  let moved = false
  const handleMove = (ev: MouseEvent): void => {
    const dxPx = ev.clientX - startX
    if (Math.abs(dxPx) > 3) moved = true
    onMove(dxPx / PX_PER_MS)
  }
  const handleUp = (): void => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (!moved && onClick) onClick()
  }
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
  document.body.style.cursor = cursor
  document.body.style.userSelect = 'none'
}

export function TimelineStrip({
  cuts,
  characterColor,
  selectedCutId,
  onSelectCut,
  onLineGap,
  onEffectDuration,
  laneHeight = DEFAULT_LANE_H
}: {
  cuts: Cut[]
  characterColor: (characterId: number) => string
  /** 선택된 컷(강조). Final Cut 스타일 에디터에서 사용. */
  selectedCutId?: number | null
  /** 컷 밴드/블록 클릭 시 호출(선택). 없으면 비-인터랙티브(읽기전용 strip). */
  onSelectCut?: (cutId: number) => void
  /** 대사 블록 드래그로 gapBeforeMs 조절. 없으면 대사 드래그 비활성. */
  onLineGap?: (cutId: number, lineId: number, gapMs: number) => void
  /** 효과 블록 오른쪽 끝 드래그로 길이(ms) 조절. 없으면 길이 드래그 비활성. */
  onEffectDuration?: (kind: 'sound' | 'cut', cutId: number, effectId: number, durationMs: number) => void
  /** 레인 높이(px). 도크 리사이즈 시 레인을 키워 타임라인 전체 높이를 늘린다. */
  laneHeight?: number
}): React.JSX.Element {
  const LANE_H = laneHeight
  const tl = buildTimeline(cuts, (e) => CUT_EFFECT_TYPE_LABEL[e.type])
  const totalW = Math.max(120, tl.totalMs * PX_PER_MS)
  const trackH = LANE_H * 3 + LANE_GAP * 2
  const selectable = typeof onSelectCut === 'function'

  return (
    <div>
      <div className="ed-timeline" style={{ height: trackH + 16 }}>
        <div
          className={`ed-tl-track${selectable ? ' ed-tl-track--selectable' : ''}`}
          style={{ width: totalW, height: trackH }}
        >
          {/* 컷 경계 + hold */}
          {tl.cuts.map((cutSeg) => {
            const left = cutSeg.startMs * PX_PER_MS
            const w = (cutSeg.endMs - cutSeg.startMs) * PX_PER_MS
            const holdLeft = (cutSeg.endMs - cutSeg.holdMs) * PX_PER_MS
            const holdW = cutSeg.holdMs * PX_PER_MS
            const isSelected = selectedCutId === cutSeg.cutId
            return (
              <div key={`cut-${cutSeg.cutId}`}>
                <div
                  className={`ed-tl-cutband${isSelected ? ' ed-tl-cutband--selected' : ''}`}
                  style={{ left, width: w }}
                  title={`컷 ${cutSeg.cutId}`}
                  onClick={selectable ? () => onSelectCut!(cutSeg.cutId) : undefined}
                />
                {cutSeg.holdMs > 0 && (
                  <div
                    className="ed-tl-block ed-tl-block--hold"
                    style={{ left: holdLeft, width: Math.max(4, holdW), top: 0, height: trackH }}
                    title={`hold ${cutSeg.holdMs}ms`}
                  />
                )}
              </div>
            )
          })}

          {/* lane 0: 대사 — 좌우 드래그로 gapBeforeMs 조절 */}
          {tl.cuts.flatMap((cutSeg) => {
            const cut = cuts.find((c) => c.id === cutSeg.cutId)!
            return cutSeg.lines.map((ls) => {
              const line = cut.lines.find((l) => l.id === ls.lineId)!
              // 앵커가 걸린 라인은 gap 이 무시되므로 드래그 비활성(앵커로 고정).
              const gapDraggable = typeof onLineGap === 'function' && line.anchor == null
              const startGap = ls.gapBeforeMs
              return (
                <div
                  key={`l-${ls.lineId}`}
                  className={`ed-tl-block${ls.overlap ? ' ed-tl-block--overlap' : ''}${
                    gapDraggable ? ' ed-tl-block--drag-x' : ''
                  }`}
                  style={{
                    left: ls.startMs * PX_PER_MS,
                    width: Math.max(24, ls.durationMs * PX_PER_MS),
                    top: 0,
                    height: LANE_H,
                    background: characterColor(line.characterId)
                  }}
                  title={
                    gapDraggable
                      ? `대사 ${formatMs(ls.durationMs)} · gap ${ls.gapBeforeMs}ms — 드래그로 앞 여백 조절`
                      : `대사 ${formatMs(ls.durationMs)}${ls.overlap ? ' · 겹침' : ''}`
                  }
                  onMouseDown={
                    gapDraggable
                      ? (e) =>
                          beginDrag(
                            e,
                            'ew-resize',
                            (deltaMs) => onLineGap!(cutSeg.cutId, ls.lineId, snap(startGap + deltaMs)),
                            selectable ? () => onSelectCut!(cutSeg.cutId) : undefined
                          )
                      : selectable
                        ? () => onSelectCut!(cutSeg.cutId)
                        : undefined
                  }
                >
                  {formatMs(ls.durationMs)}
                </div>
              )
            })
          })}

          {/* lane 1: 효과음 / lane 2: 시각효과 — 오른쪽 끝 드래그로 길이 조절 */}
          {tl.cuts.flatMap((cutSeg) =>
            cutSeg.effects.map((es) => {
              const isSound = es.kind === 'sound'
              const top = isSound ? LANE_H + LANE_GAP : (LANE_H + LANE_GAP) * 2
              const durDraggable = typeof onEffectDuration === 'function'
              const startDur = es.durationMs
              return (
                <div
                  key={`${es.kind}-${es.effectId}`}
                  className="ed-tl-block ed-tl-block--effect"
                  style={{
                    left: es.startMs * PX_PER_MS,
                    width: Math.max(24, es.durationMs * PX_PER_MS),
                    top,
                    height: LANE_H,
                    background: isSound ? SOUND_EFFECT_COLOR : CUT_EFFECT_COLOR
                  }}
                  title={`${isSound ? '효과음' : '시각효과'} · ${es.label} · ${formatMs(es.durationMs)}${
                    durDraggable ? ' — 오른쪽 끝 드래그로 길이 조절' : ''
                  }`}
                  onMouseDown={
                    selectable ? () => onSelectCut!(cutSeg.cutId) : undefined
                  }
                >
                  {isSound ? '🔊' : '✦'} {es.label}
                  {durDraggable && (
                    <span
                      className="ed-tl-resize"
                      title="드래그로 길이 조절"
                      onMouseDown={(e) =>
                        beginDrag(e, 'ew-resize', (deltaMs) =>
                          onEffectDuration!(
                            es.kind,
                            es.cutId,
                            es.effectId,
                            Math.max(MIN_EFFECT_MS, snap(startDur + deltaMs))
                          )
                        )
                      }
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="ed-tl-legend">
        <span>총 길이 {formatMs(tl.totalMs)}</span>
        <span>
          <span className="ed-tl-swatch" style={{ background: '#6366f1' }} /> 대사
        </span>
        <span>
          <span className="ed-tl-swatch" style={{ background: SOUND_EFFECT_COLOR }} /> 효과음
        </span>
        <span>
          <span className="ed-tl-swatch" style={{ background: CUT_EFFECT_COLOR }} /> 시각효과
        </span>
        <span>· 빗금 = 겹침(음수 gap) · 회색 = hold</span>
        {(typeof onLineGap === 'function' || typeof onEffectDuration === 'function') && (
          <span style={{ color: 'var(--vt-accent)' }}>
            · 대사 드래그 = gap · 효과 끝 드래그 = 길이
          </span>
        )}
        {selectable && <span style={{ color: 'var(--vt-accent)' }}>· 컷 클릭 → 선택</span>}
      </div>
    </div>
  )
}
