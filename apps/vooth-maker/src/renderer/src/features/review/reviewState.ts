/**
 * 검수 세션 상태 헬퍼 (순수 함수).
 * 검수는 작품→에피소드→회차로 화면을 이동해도 편집(승인/선택/gap)이 유지돼야 하므로
 * 이 상태는 ReviewContext 에서 한 번 만들어 공유한다. (세션 로컬 mock)
 */

import type { Episode, Line, Recording } from '../../types/domain'
import { MOCK_EPISODES } from '../../mocks/episodes.mock'

/** mock 회차를 편집 가능한 깊은 복사본으로. */
export function deepCloneEpisodes(): Episode[] {
  return MOCK_EPISODES.map((ep) => ({
    ...ep,
    cuts: ep.cuts.map((cut) => ({
      ...cut,
      lines: cut.lines.map((line) => ({ ...line, recordings: line.recordings.map((r) => ({ ...r })) }))
    }))
  }))
}

/** 특정 회차의 특정 라인을 불변 변환. */
export function mapEpisodeLine(
  episodes: Episode[],
  episodeId: string,
  lineId: string,
  fn: (line: Line) => Line
): Episode[] {
  return episodes.map((ep) =>
    ep.id !== episodeId
      ? ep
      : {
          ...ep,
          cuts: ep.cuts.map((cut) =>
            cut.lines.some((l) => l.id === lineId)
              ? { ...cut, lines: cut.lines.map((l) => (l.id === lineId ? fn(l) : l)) }
              : cut
          )
        }
  )
}

/** 라인의 최종 선택된 DONE 녹음(확정된 경우). */
export function selectedDoneRec(line: Line): Recording | undefined {
  const sel = line.recordings.find((r) => r.id === line.selectedRecordingId)
  return sel && sel.status === 'DONE' ? sel : undefined
}

/** 회차의 검수 요약(녹음 있는 라인 기준). */
export interface EpisodeReviewStat {
  lines: number
  resolved: number
  pendingTakes: number
  canFinalApprove: boolean
}

export function episodeReviewStat(episode: Episode): EpisodeReviewStat {
  const lines = episode.cuts.flatMap((c) => c.lines).filter((l) => l.recordings.length > 0)
  const resolved = lines.filter((l) => selectedDoneRec(l)).length
  const pendingTakes = lines.reduce(
    (sum, l) => sum + l.recordings.filter((r) => r.status === 'RECORDED' || r.status === 'REVIEW').length,
    0
  )
  const canFinalApprove = lines.length > 0 && pendingTakes === 0 && resolved === lines.length
  return { lines: lines.length, resolved, pendingTakes, canFinalApprove }
}

/** 검수 대상 라인(녹음이 1개 이상). */
export function reviewableLines(episode: Episode): Line[] {
  return episode.cuts.flatMap((c) => c.lines).filter((l) => l.recordings.length > 0)
}
