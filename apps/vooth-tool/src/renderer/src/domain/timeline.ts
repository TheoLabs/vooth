import type { Cut, Line } from './types'

/**
 * 타임라인 유도 (docs §15.2 / §15.7).
 * 컷/회차 길이는 저장하지 않고 채택 take durationMs + gapBeforeMs + holdMs 로 계산한다.
 * 여기서는 mock 이라 라인 durationMs 를 결정적으로 추정한다(채택본 길이 대용).
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

export interface TimelineCutSeg {
  cutId: number
  startMs: number
  endMs: number
  holdMs: number
  lines: TimelineLineSeg[]
}

export interface Timeline {
  cuts: TimelineCutSeg[]
  totalMs: number
}

/** 컷·라인 순서대로 타임라인을 유도. gap(음수=겹침)·hold 반영. */
export function buildTimeline(cuts: Cut[]): Timeline {
  let cursor = 0
  const tlCuts: TimelineCutSeg[] = []

  const ordered = [...cuts].sort((a, b) => a.position - b.position)
  for (const cut of ordered) {
    const cutStart = cursor
    const lineSegs: TimelineLineSeg[] = []
    const lines = [...cut.lines].sort((a, b) => a.position - b.position)
    for (const line of lines) {
      // gapBeforeMs 적용(음수면 앞 라인과 겹쳐 cursor 를 당김).
      cursor += line.gapBeforeMs
      if (cursor < cutStart) cursor = cutStart // 컷 시작 이전으로는 안 당김(클램프)
      const dur = estimateLineDurationMs(line)
      lineSegs.push({
        lineId: line.id,
        cutId: cut.id,
        startMs: cursor,
        durationMs: dur,
        gapBeforeMs: line.gapBeforeMs,
        overlap: line.gapBeforeMs < 0
      })
      cursor += dur
    }
    // 마지막 대사 뒤 hold.
    cursor += cut.holdMs
    tlCuts.push({
      cutId: cut.id,
      startMs: cutStart,
      endMs: cursor,
      holdMs: cut.holdMs,
      lines: lineSegs
    })
  }

  return { cuts: tlCuts, totalMs: cursor }
}
