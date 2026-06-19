import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEpisodeDetail, getRecordingsForLine } from '../domain/mockData'
import {
  RECORDING_STATUS_LABEL,
  RecordingStatus,
  type EpisodeDetail,
  type Line,
  type Recording
} from '../domain/types'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { Waveform } from '../components/Waveform'
import { RECORDING_STATUS_BADGE, formatMs } from '../domain/format'
import './tool.css'
import './adopt.css'

/**
 * 채택(Final take selection). docs §13.
 * 라인별로, 캐스트(성우) 단위로 제출된 take 목록을 보여주고,
 * 검수자가 (line × creator) 별 채택본(selectedRecordingId)을 고른다.
 * APPROVED take 만 채택 가능. 승인/반려(사유)도 여기서.
 */
export function EpisodeAdoptPage(): React.JSX.Element {
  const { episodeId } = useParams()
  const navigate = useNavigate()
  const id = Number(episodeId)
  const detail = useMemo<EpisodeDetail>(() => getEpisodeDetail(id), [id])

  const allLines: Line[] = useMemo(
    () => detail.cuts.flatMap((c) => [...c.lines].sort((a, b) => a.position - b.position)),
    [detail]
  )
  const charById = useMemo(() => new Map(detail.characters.map((c) => [c.id, c])), [detail])
  const castById = useMemo(() => new Map(detail.casts.map((c) => [c.creatorId, c])), [detail])

  // 라인별 녹음(mock) — 한 번만 생성해 고정.
  const recordingsByLine = useMemo(() => {
    const m = new Map<number, Recording[]>()
    for (const l of allLines) m.set(l.id, getRecordingsForLine(l.id))
    return m
  }, [allLines])

  // 채택 상태: lineId → creatorId → recordingId. 초기값은 mock line.selectedTakeByCreator.
  const [selection, setSelection] = useState<Record<number, Record<number, number>>>(() => {
    const init: Record<number, Record<number, number>> = {}
    for (const l of allLines) init[l.id] = { ...l.selectedTakeByCreator }
    return init
  })
  // 검수 상태 오버라이드: recordingId → status (승인/반려 액션 반영).
  const [statusOverride, setStatusOverride] = useState<Record<number, RecordingStatus>>({})

  const recStatus = (r: Recording): RecordingStatus => statusOverride[r.id] ?? r.status

  const adopt = (lineId: number, creatorId: number, recordingId: number): void => {
    setSelection((prev) => ({ ...prev, [lineId]: { ...prev[lineId], [creatorId]: recordingId } }))
  }
  const setStatus = (recordingId: number, status: RecordingStatus): void => {
    if (status === RecordingStatus.REJECTED) {
      const reason = window.prompt('반려 사유를 입력하세요.', '발음/노이즈 재녹음 요청')
      if (reason == null) return
    }
    setStatusOverride((prev) => ({ ...prev, [recordingId]: status }))
    // 반려된 take 가 채택돼 있으면 채택 해제.
    if (status === RecordingStatus.REJECTED) {
      setSelection((prev) => {
        const next = { ...prev }
        for (const lid of Object.keys(next)) {
          const byCreator = { ...next[Number(lid)] }
          for (const cid of Object.keys(byCreator)) {
            if (byCreator[Number(cid)] === recordingId) delete byCreator[Number(cid)]
          }
          next[Number(lid)] = byCreator
        }
        return next
      })
    }
  }

  // 채택 진행 카운트(라인×캐스트 단위).
  const adoptedCount = useMemo(() => {
    let done = 0
    let total = 0
    for (const l of allLines) {
      const ch = charById.get(l.characterId)
      // 그 라인 캐릭터에 캐스팅된 성우 수만큼 채택 대상.
      const casts = detail.casts.filter((c) => ch && c.characterIds.includes(ch.id))
      total += casts.length
      for (const c of casts) if (selection[l.id]?.[c.creatorId]) done += 1
    }
    return { done, total }
  }, [allLines, charById, detail.casts, selection])

  return (
    <div className="tool-page">
      <div>
        <button className="ed-back" onClick={() => navigate(`/episodes/${id}`)}>
          ← 연출 에디터
        </button>
        <div className="tool-page__head">
          <div>
            <h2 className="tool-page__title">채택 — {detail.contentTitle} {detail.episodeNo}화</h2>
            <p className="tool-page__desc">
              (대사 × 성우) 별 채택본 1개를 선택합니다. 승인(APPROVED)된 take 만 채택 가능.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <MockNote />
            <span className="tool-count">
              채택 <strong>{adoptedCount.done}</strong>/{adoptedCount.total}
            </span>
          </div>
        </div>
      </div>

      {allLines.map((line) => {
        const ch = charById.get(line.characterId)
        const recs = recordingsByLine.get(line.id) ?? []
        // 이 라인 캐릭터에 캐스팅된 성우들.
        const casts = detail.casts.filter((c) => ch && c.characterIds.includes(ch.id))
        return (
          <div key={line.id} className="tool-card ad-line">
            <div className="ad-line__head">
              <span className="ad-line__char">
                <span
                  className="ed-line__dot"
                  style={{ background: ch?.color ?? '#94a3b8', width: 10, height: 10, borderRadius: '50%' }}
                />
                {ch?.name ?? '미지정'}
              </span>
              <span className="ad-line__text">{line.text}</span>
            </div>

            {casts.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: 12 }}>캐스팅된 성우 없음</div>
            )}

            {casts.map((cast) => {
              const castRecs = recs.filter((r) => r.creatorId === cast.creatorId)
              const selectedRecId = selection[line.id]?.[cast.creatorId]
              return (
                <div key={cast.creatorId} className="ad-cast">
                  <div className="ad-cast__head">
                    <span>🎙 {castById.get(cast.creatorId)?.creatorName ?? cast.creatorId}</span>
                    {selectedRecId ? (
                      <span className="ad-selected-tag">채택됨 · take {castRecs.find((r) => r.id === selectedRecId)?.take}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>미채택</span>
                    )}
                  </div>
                  {castRecs.map((r) => {
                    const st = recStatus(r)
                    const sbadge = RECORDING_STATUS_BADGE[st]
                    const isSelected = selectedRecId === r.id
                    const canAdopt = st === RecordingStatus.APPROVED
                    return (
                      <div
                        key={r.id}
                        className={`ad-take${isSelected ? ' ad-take--selected' : ''}`}
                      >
                        <span className="ad-take__no">take {r.take}</span>
                        <button
                          className="ad-take__play"
                          title="재생(mock)"
                          onClick={() => window.alert(`재생(mock): take ${r.take} / ${formatMs(r.durationMs)}`)}
                        >
                          ▶
                        </button>
                        <Waveform bars={r.waveform} color={isSelected ? '#4f46e5' : '#cbd5e1'} />
                        <span className="ad-take__dur">{formatMs(r.durationMs)}</span>
                        <Badge label={RECORDING_STATUS_LABEL[st]} {...sbadge} />
                        <div className="ad-take__actions">
                          {st !== RecordingStatus.APPROVED && st !== RecordingStatus.REJECTED && (
                            <button
                              className="tool-btn tool-btn--sm"
                              onClick={() => setStatus(r.id, RecordingStatus.APPROVED)}
                            >
                              승인
                            </button>
                          )}
                          {st !== RecordingStatus.REJECTED && (
                            <button
                              className="tool-btn tool-btn--sm tool-btn--danger"
                              onClick={() => setStatus(r.id, RecordingStatus.REJECTED)}
                            >
                              반려
                            </button>
                          )}
                          <button
                            className={`tool-btn tool-btn--sm${isSelected ? '' : ' tool-btn--primary'}`}
                            disabled={!canAdopt || isSelected}
                            title={canAdopt ? '이 take 채택' : '승인된 take 만 채택 가능'}
                            onClick={() => adopt(line.id, cast.creatorId, r.id)}
                          >
                            {isSelected ? '채택됨' : '채택'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {castRecs.length === 0 && (
                    <div className="ad-take" style={{ color: '#94a3b8', fontSize: 12 }}>
                      제출된 녹음 없음
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
