import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useReview } from '../features/review/ReviewContext'
import { reviewableLines, selectedDoneRec } from '../features/review/reviewState'
import { RECORDING_STATUS_META, type Recording } from '../types/domain'
import { formatMs } from '../lib/timeline'
import { PreviewPlayer } from '../features/preview/PreviewPlayer'
import './ReviewQueuePage.css'

/** take 1건의 재생 버튼(blob 일 때만 활성, mock 은 "샘플"). */
function TakePlay({ rec }: { rec: Recording }): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const canPlay = Boolean(rec.audioUrl && rec.audioUrl.startsWith('blob:'))

  useEffect(() => () => audioRef.current?.pause(), [])

  if (!canPlay) {
    return (
      <button type="button" className="rv-take__play rv-take__play--off" disabled title="샘플(오디오 없음)">
        샘플
      </button>
    )
  }

  const toggle = (): void => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const audio = new Audio(rec.audioUrl)
    audio.onended = (): void => {
      setPlaying(false)
      audioRef.current = null
    }
    audioRef.current = audio
    setPlaying(true)
    void audio.play().catch(() => setPlaying(false))
  }

  return (
    <button type="button" className="rv-take__play" onClick={toggle}>
      {playing ? '■ 정지' : '▶ 재생'}
    </button>
  )
}

export function ReviewEpisodePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const { episodes, approvedIds, approve, reject, clearSelection, changeGap, finalApprove } = useReview()
  const [showPreview, setShowPreview] = useState(true)

  const ep = useMemo(() => episodes.find((e) => e.id === id), [episodes, id])

  if (!ep) {
    return (
      <div className="review">
        <p className="review__empty">회차를 찾을 수 없습니다.</p>
        <Link className="work-list__back" to="/review">
          ← 검수 작품 목록으로
        </Link>
      </div>
    )
  }

  const lines = reviewableLines(ep)
  const resolvedLines = lines.filter((l) => selectedDoneRec(l)).length
  const pendingTakes = lines.reduce(
    (sum, l) => sum + l.recordings.filter((r) => r.status === 'RECORDED' || r.status === 'REVIEW').length,
    0
  )
  const canFinalApprove = lines.length > 0 && pendingTakes === 0 && resolvedLines === lines.length
  const approved = approvedIds.has(ep.id)

  return (
    <div className="review">
      <div className="review__intro">
        <Link className="work-list__back" to={`/review/webtoons/${ep.webtoonId}`}>
          ← {ep.webtoonTitle} 회차 목록으로
        </Link>
        <h2 className="review__heading">
          {ep.episodeNo}화 · {ep.title}
        </h2>
        <p className="review__subtitle">
          녹음을 듣고 최종 take 를 선택(승인)하거나 반려하세요. 확정 {resolvedLines}/{lines.length} 대사 · 대기{' '}
          {pendingTakes}건.
        </p>
      </div>

      <section className="review-ep">
        <header className="review-ep__head">
          <div className="review-ep__titles">
            <span className="review-ep__webtoon">{ep.webtoonTitle}</span>
            <h3 className="review-ep__title">
              <span className="review-ep__epno">{ep.episodeNo}화</span>
              {ep.title}
            </h3>
          </div>
          <div className="review-ep__summary">
            <button
              type="button"
              className="review-ep__preview"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? '미리보기 닫기' : '▶ 미리보기'}
            </button>
            {approved ? (
              <span className="review-ep__approved">최종 승인됨</span>
            ) : (
              <button
                type="button"
                className="review-ep__final"
                disabled={!canFinalApprove}
                title={canFinalApprove ? '회차 최종 승인' : '모든 대사가 확정되어야 합니다'}
                onClick={() => finalApprove(ep.id)}
              >
                회차 최종 승인
              </button>
            )}
          </div>
        </header>

        {showPreview && (
          <div className="review-ep__player">
            <PreviewPlayer
              episode={ep}
              onSelectTake={(lineId, recId) =>
                recId ? approve(ep.id, lineId, recId) : clearSelection(ep.id, lineId)
              }
              onChangeGap={(lineId, gap) => changeGap(ep.id, lineId, gap)}
            />
          </div>
        )}

        <ul className="review-ep__lines">
          {lines.map((line) => {
            const resolved = Boolean(selectedDoneRec(line))
            return (
              <li key={line.id} className={`rv-line${resolved ? ' rv-line--resolved' : ''}`}>
                <div className="rv-line__text">
                  {line.character && <span className="rv-line__character">{line.character}</span>}
                  <span className="rv-line__body">{line.text}</span>
                  {resolved && <span className="rv-line__resolved">확정</span>}
                </div>
                <ul className="rv-takes">
                  {line.recordings.map((rec) => {
                    const meta = RECORDING_STATUS_META[rec.status]
                    const isFinal = rec.id === line.selectedRecordingId && rec.status === 'DONE'
                    return (
                      <li key={rec.id} className={`rv-take${isFinal ? ' rv-take--final' : ''}`}>
                        <span className="rv-take__name">{rec.voiceActorName}</span>
                        <span
                          className="rv-take__badge"
                          style={{ color: meta.color, background: meta.background }}
                        >
                          {meta.label}
                        </span>
                        <span className="rv-take__dur">{formatMs(rec.durationMs)}</span>
                        <TakePlay rec={rec} />
                        {isFinal && <span className="rv-take__final">최종</span>}
                        <button
                          type="button"
                          className="rv-take__approve"
                          disabled={isFinal}
                          onClick={() => approve(ep.id, line.id, rec.id)}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="rv-take__reject"
                          disabled={rec.status === 'REJECTED'}
                          onClick={() => reject(ep.id, line.id, rec.id)}
                        >
                          반려
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
