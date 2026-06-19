import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MOCK_EPISODE_REVIEWS,
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_VARIANT,
  type ReviewStatus,
} from '../features/episodes/recording.mock'
import './ReviewsPage.css'

/** UTC ISO → 로컬 'M월 D일 HH:MM' */
function formatLocalDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}

const FILTERS: { value: ReviewStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'REVIEWING', label: '검수 중' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
]

/** 검수 현황 — 내 검수 요청(EpisodeReview, 회차×성우 단위). 반려 → 재녹음 이동. */
export function ReviewsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ReviewStatus | 'ALL'>('ALL')

  const rows = useMemo(
    () =>
      MOCK_EPISODE_REVIEWS.filter((r) => filter === 'ALL' || r.status === filter).sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [filter],
  )

  return (
    <div className="rv">
      <div className="rv__head">
        <h2 className="rv__title">검수 현황</h2>
        <span className="rv__mock-tag">MOCK</span>
        <span className="rv__total">총 {rows.length}건</span>
      </div>

      <div className="rv__filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`rv__chip${filter === f.value ? ' rv__chip--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rv__empty">검수 요청 내역이 없습니다.</div>
      ) : (
        <ul className="rv__list">
          {rows.map((r) => (
            <li key={r.id} className="rv-card">
              <div className="rv-card__head">
                <div className="rv-card__titles">
                  <span className="rv-card__work">{r.workTitle}</span>
                  <span className="rv-card__ep">
                    {r.episodeNo}화 · {r.episodeTitle}
                  </span>
                  <span className="rv-card__role">🎭 {r.role}</span>
                </div>
                <span className={`rv-badge rv-badge--${REVIEW_STATUS_VARIANT[r.status]}`}>
                  {REVIEW_STATUS_LABEL[r.status]}
                </span>
              </div>

              <div className="rv-card__meta">
                <span>검수 요청 {formatLocalDateTime(r.requestedAt)}</span>
                {r.resolvedAt && <span>처리 {formatLocalDateTime(r.resolvedAt)}</span>}
              </div>

              {r.status === 'REJECTED' && r.rejectionNote && (
                <p className="rv-card__reject">
                  <strong>반려 사유</strong> {r.rejectionNote}
                </p>
              )}

              {r.status === 'REJECTED' && (
                <div className="rv-card__actions">
                  <button
                    type="button"
                    className="rv-btn rv-btn--primary"
                    onClick={() => navigate(`/works/${r.episodeId}`)}
                  >
                    재녹음하기
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
