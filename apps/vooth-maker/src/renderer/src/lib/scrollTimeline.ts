/**
 * anchorY 기반 연속 세로 스크롤 타임라인 (docs §15.2).
 * 컷 원본을 실제 높이로 이어 붙인 캔버스를, 대사 anchorY 키프레임으로 스크롤한다.
 * 라인 길이는 실제 녹음 durationMs 를 쓰고, 없으면 placeholder 로 메운다(음성 기반 스크롤).
 */

import { FRAME_RATIO } from './cropBox'

export const PLACEHOLDER_LINE_MS = 1800

export interface ScrollInputLine {
  id: number
  script: string
  characterName: string
  anchorY?: number | null
  gapBeforeMs?: number | null
  /** 채택/대표 take 의 길이. 없으면 placeholder. */
  durationMs?: number | null
}
export interface ScrollInputCut {
  imageUrl?: string
  imageWidth?: number | null
  imageHeight?: number | null
  holdMs?: number | null
  lines: ScrollInputLine[]
}

export interface ScrollLineSeg {
  id: number
  script: string
  characterName: string
  start: number
  end: number
  anchorPixel: number
}
export interface ScrollCutSeg {
  top: number
  height: number
  imageUrl?: string
  lines: ScrollLineSeg[]
}
export interface ScrollKeyframe {
  time: number
  scrollY: number
}
export interface ScrollTimeline {
  totalMs: number
  totalHeight: number
  viewportH: number
  renderW: number
  cuts: ScrollCutSeg[]
  keyframes: ScrollKeyframe[]
}

function evenDefault(index: number, count: number): number {
  return count > 0 ? (index + 0.5) / count : 0.5
}

function cutHeight(cut: ScrollInputCut, renderW: number): number {
  if (cut.imageWidth && cut.imageHeight) return (renderW * cut.imageHeight) / cut.imageWidth
  return renderW / FRAME_RATIO
}

export function buildScrollTimeline(
  cuts: ScrollInputCut[],
  opts: { renderW: number; viewportH: number }
): ScrollTimeline {
  const { renderW, viewportH } = opts
  let t = 0
  let top = 0
  const segs: ScrollCutSeg[] = []

  for (const cut of cuts) {
    const height = cutHeight(cut, renderW)
    const lines: ScrollLineSeg[] = cut.lines.map((line, i) => {
      const start = t + Math.max(0, line.gapBeforeMs ?? 0)
      const end = start + (line.durationMs ?? PLACEHOLDER_LINE_MS)
      t = end
      const anchorY = line.anchorY ?? evenDefault(i, cut.lines.length)
      return {
        id: line.id,
        script: line.script,
        characterName: line.characterName,
        start,
        end,
        anchorPixel: top + anchorY * height
      }
    })
    if (cut.lines.length === 0) t += PLACEHOLDER_LINE_MS
    t += Math.max(0, cut.holdMs ?? 0)
    segs.push({ top, height, imageUrl: cut.imageUrl, lines })
    top += height
  }

  const totalHeight = top
  const maxScroll = Math.max(0, totalHeight - viewportH)
  const clamp = (y: number): number => Math.min(maxScroll, Math.max(0, y))

  // 시작은 컷1 맨 위(scrollY 0)에서 → 첫 대사 앵커로 글라이드(리드인).
  const LEAD_MS = 700
  const keyframes: ScrollKeyframe[] = []
  let first = true
  for (const cut of segs) {
    for (const line of cut.lines) {
      const scrollY = clamp(line.anchorPixel - viewportH / 2)
      if (first) {
        keyframes.push({ time: 0, scrollY: 0 })
        keyframes.push({ time: Math.max(1, Math.min(line.end, line.start + LEAD_MS)), scrollY })
        first = false
      } else {
        keyframes.push({ time: line.start, scrollY })
      }
    }
  }
  if (keyframes.length === 0) keyframes.push({ time: 0, scrollY: 0 })

  return { totalMs: t, totalHeight, viewportH, renderW, cuts: segs, keyframes }
}

function smoothstep(x: number): number {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

export function scrollYAt(timeline: ScrollTimeline, t: number): number {
  const kf = timeline.keyframes
  if (t <= kf[0].time) return kf[0].scrollY
  if (t >= kf[kf.length - 1].time) return kf[kf.length - 1].scrollY
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i]
    const b = kf[i + 1]
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time || 1
      return a.scrollY + (b.scrollY - a.scrollY) * smoothstep((t - a.time) / span)
    }
  }
  return kf[kf.length - 1].scrollY
}

export function lineAt(timeline: ScrollTimeline, t: number): ScrollLineSeg | undefined {
  for (const cut of timeline.cuts) {
    const line = cut.lines.find((l) => t >= l.start && t < l.end)
    if (line) return line
  }
  return undefined
}
