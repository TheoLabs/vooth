/**
 * 타임라인 계산 유틸.
 *
 * 핵심 원칙: 엔티티에 절대 startMs/endMs 를 저장하지 않는다.
 * 대신 (오디오 길이 + 순서 + 간격)으로부터 매번 타임라인을 "유도"한다.
 * 멀티캐스팅에서는 라인별 `selectedRecordingId` 로 선택된 take 1개만 최종에 재생된다.
 */

import type { Episode } from '../types/domain'

/** 선택된 녹음이 없거나 길이를 알 수 없을 때 사용하는 기본 자리표시 길이(ms). */
export const DEFAULT_PLACEHOLDER_MS = 2000

/** 라인 1개의 유도된 타임라인 구간. */
export interface LineTimeline {
  lineId: string
  /** 최종 재생에 사용된 녹음 id (선택/해결된 경우). */
  recordingId?: string
  startMs: number
  endMs: number
  /** 선택된 녹음으로 길이가 확정되었으면 true, 자리표시(placeholder)면 false. */
  resolved: boolean
}

/** 컷 1개의 유도된 타임라인 구간 (포함된 라인들 포함). */
export interface CutTimeline {
  cutId: string
  startMs: number
  endMs: number
  lines: LineTimeline[]
}

/** 회차 전체의 유도된 타임라인. */
export interface EpisodeTimeline {
  totalMs: number
  cuts: CutTimeline[]
}

/**
 * 회차의 컷/라인을 order 오름차순으로 순회하며 타임라인을 계산한다.
 * - 각 라인: t += gapBeforeMs → 선택된 녹음 길이(없으면 placeholder)만큼 진행.
 * - 각 컷: 라인들이 끝난 뒤 t += holdMs.
 */
export function buildTimeline(episode: Episode): EpisodeTimeline {
  let t = 0
  const cuts: CutTimeline[] = []

  const orderedCuts = [...episode.cuts].sort((a, b) => a.order - b.order)
  for (const cut of orderedCuts) {
    const cutStart = t
    const lines: LineTimeline[] = []

    const orderedLines = [...cut.lines].sort((a, b) => a.order - b.order)
    for (const line of orderedLines) {
      t += line.gapBeforeMs

      const rec = line.recordings.find((r) => r.id === line.selectedRecordingId)
      const dur = rec ? rec.durationMs : DEFAULT_PLACEHOLDER_MS
      const start = t
      t += dur

      lines.push({
        lineId: line.id,
        recordingId: rec?.id,
        startMs: start,
        endMs: t,
        resolved: !!rec
      })
    }

    t += cut.holdMs
    cuts.push({ cutId: cut.id, startMs: cutStart, endMs: t, lines })
  }

  return { totalMs: t, cuts }
}

/** ms 를 `m:ss` 형태(분이 두 자리면 `mm:ss`)로 표시한다. */
export function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
