import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Episode } from '../../types/domain'
import { deepCloneEpisodes, mapEpisodeLine } from './reviewState'

/**
 * 검수 세션 컨텍스트.
 * /review/* 하위 화면(작품 목록 → 에피소드 목록 → 회차 검수)에서 같은 상태를 공유한다.
 * (세션 로컬 mock — 다른 화면/백엔드와 미공유, 저장 안 됨)
 */
interface ReviewContextValue {
  episodes: Episode[]
  approvedIds: Set<string>
  /** 승인 = 해당 take 를 DONE + 그 라인의 최종 take 로 선택(검수자가 최종 결정). */
  approve: (episodeId: string, lineId: string, recordingId: string) => void
  /** 반려 = REJECTED. 최종이었으면 선택 해제. */
  reject: (episodeId: string, lineId: string, recordingId: string) => void
  /** 최종 선택 해제. */
  clearSelection: (episodeId: string, lineId: string) => void
  /** 앞 간격(gap) 조절(음수=겹침, 하한 -3000ms). */
  changeGap: (episodeId: string, lineId: string, gapBeforeMs: number) => void
  /** 회차 최종 승인. */
  finalApprove: (episodeId: string) => void
}

const ReviewContext = createContext<ReviewContextValue | null>(null)

function ReviewProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [episodes, setEpisodes] = useState<Episode[]>(deepCloneEpisodes)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() => new Set())

  const approve = useCallback((episodeId: string, lineId: string, recordingId: string): void => {
    setEpisodes((prev) =>
      mapEpisodeLine(prev, episodeId, lineId, (line) => ({
        ...line,
        selectedRecordingId: recordingId,
        recordings: line.recordings.map((r) => (r.id === recordingId ? { ...r, status: 'DONE' } : r))
      }))
    )
  }, [])

  const reject = useCallback((episodeId: string, lineId: string, recordingId: string): void => {
    setEpisodes((prev) =>
      mapEpisodeLine(prev, episodeId, lineId, (line) => ({
        ...line,
        selectedRecordingId: line.selectedRecordingId === recordingId ? undefined : line.selectedRecordingId,
        recordings: line.recordings.map((r) => (r.id === recordingId ? { ...r, status: 'REJECTED' } : r))
      }))
    )
  }, [])

  const clearSelection = useCallback((episodeId: string, lineId: string): void => {
    setEpisodes((prev) =>
      mapEpisodeLine(prev, episodeId, lineId, (line) => ({ ...line, selectedRecordingId: undefined }))
    )
  }, [])

  const changeGap = useCallback((episodeId: string, lineId: string, gapBeforeMs: number): void => {
    setEpisodes((prev) =>
      mapEpisodeLine(prev, episodeId, lineId, (line) => ({ ...line, gapBeforeMs: Math.max(-3000, gapBeforeMs) }))
    )
  }, [])

  const finalApprove = useCallback((episodeId: string): void => {
    setApprovedIds((prev) => new Set(prev).add(episodeId))
  }, [])

  const value = useMemo<ReviewContextValue>(
    () => ({ episodes, approvedIds, approve, reject, clearSelection, changeGap, finalApprove }),
    [episodes, approvedIds, approve, reject, clearSelection, changeGap, finalApprove]
  )

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
}

/** /review 라우트 그룹의 레이아웃: 검수 세션 상태를 하위 화면에 공유. */
export function ReviewLayout(): React.JSX.Element {
  return (
    <ReviewProvider>
      <Outlet />
    </ReviewProvider>
  )
}

export function useReview(): ReviewContextValue {
  const ctx = useContext(ReviewContext)
  if (!ctx) throw new Error('useReview must be used within ReviewLayout')
  return ctx
}
