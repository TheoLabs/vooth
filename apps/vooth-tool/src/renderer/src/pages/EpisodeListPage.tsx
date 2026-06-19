import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_EPISODES } from '../domain/mockData'
import { EPISODE_STATUS_LABEL, EpisodeStatus } from '../domain/types'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { EPISODE_STATUS_BADGE, formatLocalDateTime } from '../domain/format'
import './tool.css'

const STATUS_OPTIONS: { value: EpisodeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체 상태' },
  ...Object.values(EpisodeStatus).map((s) => ({ value: s, label: EPISODE_STATUS_LABEL[s] }))
]

/** 작업 목록 — 연출 대상 회차. 검색·상태 필터 → 행 클릭 시 연출 에디터. */
export function EpisodeListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EpisodeStatus | 'all'>('all')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_EPISODES.filter((e) => {
      if (status !== 'all' && e.status !== status) return false
      if (!q) return true
      return (
        e.contentTitle.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        String(e.episodeNo).includes(q)
      )
    })
  }, [search, status])

  return (
    <div className="tool-page">
      <div className="tool-page__head">
        <div>
          <h2 className="tool-page__title">작업 목록</h2>
          <p className="tool-page__desc">연출·검수 대상 회차. 행을 클릭하면 연출 에디터로 이동합니다.</p>
        </div>
        <MockNote />
      </div>

      <div className="tool-toolbar">
        <input
          className="tool-input"
          placeholder="작품·회차·제목 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select
          className="tool-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as EpisodeStatus | 'all')}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="tool-toolbar__spacer" />
        <span className="tool-count">
          총 <strong>{rows.length}</strong>건
        </span>
      </div>

      <div className="tool-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tool-table">
          <thead>
            <tr>
              <th>작품</th>
              <th>회차</th>
              <th>제목</th>
              <th>상태</th>
              <th>연출 진행</th>
              <th>채택</th>
              <th>마지막 수정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const badge = EPISODE_STATUS_BADGE[e.status]
              const adoptPct =
                e.totalAdoptableCount > 0
                  ? Math.round((e.adoptedLineCount / e.totalAdoptableCount) * 100)
                  : 0
              return (
                <tr
                  key={e.id}
                  className="is-clickable"
                  onClick={() => navigate(`/episodes/${e.id}`)}
                >
                  <td style={{ fontWeight: 600 }}>{e.contentTitle}</td>
                  <td>{e.episodeNo}화</td>
                  <td>{e.title}</td>
                  <td>
                    <Badge label={EPISODE_STATUS_LABEL[e.status]} {...badge} />
                  </td>
                  <td style={{ color: '#64748b' }}>
                    컷 {e.cutCount} · 대사 {e.lineCount}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="tool-progress tool-progress--mini">
                        <span className="tool-progress__fill" style={{ width: `${adoptPct}%` }} />
                      </span>
                      <span style={{ fontSize: 12, color: '#475569' }}>
                        {e.adoptedLineCount}/{e.totalAdoptableCount}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{formatLocalDateTime(e.updatedAt)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                  조건에 맞는 회차가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
