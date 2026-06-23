import {
  AnchorEdge,
  AnchorType,
  type Anchor,
  type Cut,
  type CutEffect,
  type Line,
  type SoundEffect
} from './types'

/**
 * 타임라인 유도 (docs/domains/playback/index.html §03 풀 앵커 해석 + §15).
 *
 * 보이스툰은 절대 startAt/hold 를 저장하지 않는다. 각 요소(Line/SoundEffect/CutEffect)는
 * 다른 요소(또는 CUT_START)에 anchor(START/END + offsetMs)로 걸려 있고, vooth-tool 이
 * 버전 음성 길이를 넣어 실제 시간을 그 자리에서 resolve 한다. (docs §03 "연산 위치")
 *
 * MOCK: 라인 음성 길이는 채택 take.durationMs 대신 텍스트 길이로 결정적 추정한다.
 */

/** 라인 추정 길이(mock): 텍스트 길이 기반. 실제로는 채택 take.durationMs. */
export function estimateLineDurationMs(line: Line): number {
  const base = 700
  return base + line.text.length * 55
}

export interface TimelineLineSeg {
  lineId: number
  cutId: number
  startMs: number
  durationMs: number
  gapBeforeMs: number
  /** 음수 gap(겹침) 여부. */
  overlap: boolean
}

/** 효과(효과음·시각효과) 해석 세그먼트. */
export interface TimelineEffectSeg {
  kind: 'sound' | 'cut'
  effectId: number
  cutId: number
  startMs: number
  durationMs: number
  /** SFX=라벨, FX=타입 라벨. */
  label: string
}

export interface TimelineCutSeg {
  cutId: number
  startMs: number
  endMs: number
  holdMs: number
  lines: TimelineLineSeg[]
  /** 해석된 효과 세그먼트(효과음 + 시각효과). */
  effects: TimelineEffectSeg[]
}

export interface Timeline {
  cuts: TimelineCutSeg[]
  totalMs: number
}

/** 해석 결과: 컷 내 요소의 절대(컷 기준) start/end. 앵커 resolve 입력. */
interface Resolved {
  start: number
  end: number
}

/**
 * 한 앵커를 resolve 한다. 대상 요소의 (이미 해석된) start/end + edge + offset.
 * 대상이 아직 해석 전이거나 없으면 null(호출부에서 폴백).
 */
function resolveAnchor(
  anchor: Anchor | null,
  cutStart: number,
  resolvedById: Map<number, Resolved>
): number | null {
  if (!anchor) return null
  if (anchor.type === AnchorType.CUT_START) return cutStart + anchor.offsetMs
  if (anchor.targetId == null) return null
  const target = resolvedById.get(anchor.targetId)
  if (!target) return null
  const base = anchor.edge === AnchorEdge.END ? target.end : target.start
  return base + anchor.offsetMs
}

/** 컷 라벨 헬퍼(타입 → 짧은 라벨)는 호출부에서 주입. */
function sfxDuration(s: SoundEffect): number {
  return s.audioDuration
}
function fxDuration(e: CutEffect): number {
  return e.duration
}

/**
 * 컷/라인/효과를 풀 앵커로 해석해 타임라인을 유도.
 * - 라인: anchor 가 있으면 resolve, 없으면 gapBeforeMs 순차(직전 라인 END + gap).
 * - 효과: anchor resolve(라인/CUT_START 기준). 폴백 = CUT_START.
 * - cut hold = max(모든 요소 end) + holdMs(여운).
 */
export function buildTimeline(
  cuts: Cut[],
  effectLabel?: (e: CutEffect) => string
): Timeline {
  let cursor = 0
  const tlCuts: TimelineCutSeg[] = []

  const ordered = [...cuts].sort((a, b) => a.position - b.position)
  for (const cut of ordered) {
    const cutStart = cursor
    const resolvedById = new Map<number, Resolved>()
    const lineSegs: TimelineLineSeg[] = []

    // 1) 라인 — anchor 우선, 없으면 gapBeforeMs 순차.
    const lines = [...cut.lines].sort((a, b) => a.position - b.position)
    let lineCursor = cutStart
    for (const line of lines) {
      const dur = estimateLineDurationMs(line)
      const anchored = resolveAnchor(line.anchor, cutStart, resolvedById)
      let start: number
      if (anchored != null) {
        start = anchored
      } else {
        // 순차: 직전 라인 END + gapBeforeMs(음수=겹침).
        start = lineCursor + line.gapBeforeMs
      }
      if (start < cutStart) start = cutStart // 컷 시작 이전 클램프
      lineSegs.push({
        lineId: line.id,
        cutId: cut.id,
        startMs: start,
        durationMs: dur,
        gapBeforeMs: line.gapBeforeMs,
        overlap: line.gapBeforeMs < 0
      })
      resolvedById.set(line.id, { start, end: start + dur })
      lineCursor = start + dur
    }

    // 2) 효과 — 라인 해석 뒤에 resolve(효과는 보통 라인/CUT_START 에 앵커).
    const effectSegs: TimelineEffectSeg[] = []
    const sfx = [...cut.soundEffects].sort((a, b) => a.order - b.order)
    for (const s of sfx) {
      const start = resolveAnchor(s.anchor, cutStart, resolvedById) ?? cutStart
      const clamped = Math.max(cutStart, start)
      const dur = sfxDuration(s)
      effectSegs.push({
        kind: 'sound',
        effectId: s.id,
        cutId: cut.id,
        startMs: clamped,
        durationMs: dur,
        label: s.label ?? '효과음'
      })
      resolvedById.set(s.id, { start: clamped, end: clamped + dur })
    }
    const fx = [...cut.cutEffects].sort((a, b) => a.order - b.order)
    for (const e of fx) {
      const start = resolveAnchor(e.anchor, cutStart, resolvedById) ?? cutStart
      const clamped = Math.max(cutStart, start)
      const dur = fxDuration(e)
      effectSegs.push({
        kind: 'cut',
        effectId: e.id,
        cutId: cut.id,
        startMs: clamped,
        durationMs: dur,
        label: effectLabel ? effectLabel(e) : e.type
      })
      resolvedById.set(e.id, { start: clamped, end: clamped + dur })
    }

    // 3) cut hold = max(모든 요소 end) + holdMs(여운). docs §03 "hold = max(end)".
    let maxEnd = cutStart
    for (const seg of lineSegs) maxEnd = Math.max(maxEnd, seg.startMs + seg.durationMs)
    for (const seg of effectSegs) maxEnd = Math.max(maxEnd, seg.startMs + seg.durationMs)
    const cutEnd = maxEnd + cut.holdMs

    tlCuts.push({
      cutId: cut.id,
      startMs: cutStart,
      endMs: cutEnd,
      holdMs: cut.holdMs,
      lines: lineSegs,
      effects: effectSegs
    })
    cursor = cutEnd
  }

  return { cuts: tlCuts, totalMs: cursor }
}
