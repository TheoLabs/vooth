/**
 * 녹음 도메인(Recording/Line/Cut) 기반 타임라인 유도 로직.
 *
 * 핵심 원칙: 컷/회차 길이는 저장하지 않고 항상 "녹음(take)의 durationMs"로부터 유도한다.
 * - 라인 길이 = 그 라인의 대표 take durationMs (없으면 미리보기용 placeholder).
 * - 컷 길이   = 컷 내 라인 길이들의 합.
 * - 회차 길이 = 컷 길이들의 합.
 */

import { RecordingStatus, type Cut, type Recording, type RecordingEpisode } from '../types/recording-domain'

/** 아직 녹음이 없는 라인의 미리보기용 자리표시 길이(ms). */
export const DEFAULT_LINE_MS = 1500

/** 컷/회차 길이 산정용 take 우선순위. 승인 > 검수 > 녹음됨 > 반려. */
const STATUS_PRIORITY: Record<RecordingStatus, number> = {
  [RecordingStatus.APPROVED]: 3,
  [RecordingStatus.REVIEW]: 2,
  [RecordingStatus.RECORDED]: 1,
  [RecordingStatus.REJECTED]: 0
}

/** 한 라인의 대표 take(최종 재생 후보): 상태 우선순위 → 최신 take. */
export function representativeTake(recs: Recording[]): Recording | undefined {
  if (recs.length === 0) return undefined
  return [...recs].sort((a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status] || b.take - a.take)[0]
}

/** 컷의 실제 길이(미정 라인 제외) + 미정 라인 수. 화면 표기용. */
export function deriveCutDuration(cut: Cut, byLine: Record<number, Recording[]>): { ms: number; undecided: number } {
  let ms = 0
  let undecided = 0
  for (const line of cut.lines) {
    const rep = representativeTake(byLine[line.id] ?? [])
    if (rep) ms += rep.durationMs
    else undecided += 1
  }
  return { ms, undecided }
}

export interface PreviewLineSeg {
  lineId: number
  characterId: number
  script: string
  start: number
  end: number
  /** 대표 take 가 있어 길이가 확정됐으면 true, placeholder 면 false. */
  resolved: boolean
}

export interface PreviewCutSeg {
  index: number
  cutId: number
  imageUrl: string
  start: number
  end: number
  lines: PreviewLineSeg[]
}

export interface PreviewTimeline {
  totalMs: number
  cuts: PreviewCutSeg[]
}

/**
 * 미리보기용 연속 타임라인. 라인을 position 순으로 이어 붙이고,
 * 미정 라인은 placeholder 길이를 줘서 끊김 없는 타임라인을 만든다.
 */
export function buildPreviewTimeline(
  episode: RecordingEpisode,
  byLine: Record<number, Recording[]>
): PreviewTimeline {
  let t = 0
  const cuts: PreviewCutSeg[] = [...episode.cuts]
    .sort((a, b) => a.position - b.position)
    .map((cut, index) => {
      const start = t
      const lines: PreviewLineSeg[] = [...cut.lines]
        .sort((a, b) => a.position - b.position)
        .map((line) => {
          const rep = representativeTake(byLine[line.id] ?? [])
          const dur = rep ? rep.durationMs : DEFAULT_LINE_MS
          const seg: PreviewLineSeg = {
            lineId: line.id,
            characterId: line.characterId,
            script: line.script,
            start: t,
            end: t + dur,
            resolved: Boolean(rep)
          }
          t += dur
          return seg
        })
      // 대사가 없는 컷도 최소한 머무는 시간을 준다.
      if (cut.lines.length === 0) t += DEFAULT_LINE_MS
      return { index, cutId: cut.id, imageUrl: cut.imageUrl, start, end: t, lines }
    })

  return { totalMs: t, cuts }
}

/** smoothstep 이징(0→1). */
function smoothstep(x: number): number {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

/**
 * 시각 t(ms)에서의 "스크롤 단위 오프셋"(0 = 컷0 상단, 1 = 컷1 상단 …).
 * 각 컷의 끝 transitionMs 구간 동안 다음 컷으로 이징하며 넘어가고, 그 외에는 머문다(웹툰식).
 */
export function scrollUnitsAt(timeline: PreviewTimeline, t: number, transitionMs: number): number {
  const { cuts } = timeline
  if (cuts.length === 0) return 0
  const clamped = Math.min(Math.max(0, t), timeline.totalMs)

  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i]
    if (clamped < cut.start) return i // 안전망(앞 컷 상단)
    if (clamped <= cut.end) {
      if (i === cuts.length - 1) return i // 마지막 컷은 넘어갈 대상이 없음
      const dur = cut.end - cut.start
      const tau = Math.min(transitionMs, dur * 0.45)
      const transitionStart = cut.end - tau
      if (clamped <= transitionStart) return i
      return i + smoothstep((clamped - transitionStart) / tau)
    }
  }
  return cuts.length - 1
}

/** 시각 t 에서 현재 컷/라인 세그먼트. */
export function segmentAt(
  timeline: PreviewTimeline,
  t: number
): { cut?: PreviewCutSeg; line?: PreviewLineSeg } {
  const cut = timeline.cuts.find((c) => t >= c.start && t < c.end) ?? timeline.cuts[timeline.cuts.length - 1]
  const line = cut?.lines.find((l) => t >= l.start && t < l.end)
  return { cut, line }
}
