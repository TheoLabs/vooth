import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EPISODE_STATUS_LABEL,
  EPISODE_STATUS_VARIANT,
  MOCK_ASSIGNED_EPISODES,
  type AssignedEpisode,
  type EpisodeStatus,
} from '../features/episodes/recording.mock'
import './WorkListPage.css'

/** UTC ISO → 로컬 'M월 D일' (CLAUDE.md 타임스탬프 룰: 로컬 변환) */
function formatLocalDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

const STATUS_FILTERS: { value: EpisodeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'READY', label: '녹음 대기' },
  { value: 'RECORDING', label: '녹음 중' },
  { value: 'REVIEWING', label: '검수 중' },
  { value: 'PUBLISHED', label: '발행 완료' },
]

function ProgressBar({ ep }: { ep: AssignedEpisode }): React.JSX.Element {
  const pct = ep.totalLines ? Math.round((ep.recordedLines / ep.totalLines) * 100) : 0
  return (
    <div className="wl-progress">
      <div className="wl-progress__track">
        <div className="wl-progress__bar" style={{ width: `${pct}%` }} />
      </div>
      <span className="wl-progress__count">
        {ep.recordedLines}/{ep.totalLines} 라인
      </span>
    </div>
  )
}

/** 작업 목록 = 내게 배정된 회차(회차×성우 캐스팅). 행 클릭 → 녹음 화면. */
export function WorkListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [status, setStatus] = useState<EpisodeStatus | 'ALL'>('ALL')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MOCK_ASSIGNED_EPISODES.filter((e) => {
      if (status !== 'ALL' && e.status !== status) return false
      if (!q) return true
      return (
        e.workTitle.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
      )
    })
  }, [status, query])

  return (
    <div className="wl">
      <div className="wl__head">
        <h2 className="wl__title">작업 목록</h2>
        <span className="wl__mock-tag">MOCK</span>
        <span className="wl__total">총 {rows.length}건</span>
      </div>

      <div className="wl__toolbar">
        <input
          className="wl__search"
          type="text"
          placeholder="작품 · 회차 · 배역 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="wl__filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`wl__chip${status === f.value ? ' wl__chip--active' : ''}`}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="wl__empty">조건에 맞는 회차가 없습니다.</div>
      ) : (
        <ul className="wl__list">
          {rows.map((ep) => (
            <li
              key={ep.id}
              className="wl-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/works/${ep.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/works/${ep.id}`)
                }
              }}
            >
              <span className="wl-row__thumb" style={{ background: ep.thumbColor }}>
                {ep.workTitle.slice(0, 1)}
              </span>

              <div className="wl-row__main">
                <div className="wl-row__titles">
                  <span className="wl-row__work">{ep.workTitle}</span>
                  <span className="wl-row__ep">
                    {ep.episodeNo}화 · {ep.title}
                  </span>
                </div>
                <div className="wl-row__meta">
                  <span className="wl-row__role">🎭 {ep.role}</span>
                  <span className="wl-row__date">마지막 작업 {formatLocalDate(ep.updatedAt)}</span>
                </div>
              </div>

              <div className="wl-row__progress">
                <ProgressBar ep={ep} />
              </div>

              <span className={`status-pill status-pill--${EPISODE_STATUS_VARIANT[ep.status]}`}>
                {EPISODE_STATUS_LABEL[ep.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
