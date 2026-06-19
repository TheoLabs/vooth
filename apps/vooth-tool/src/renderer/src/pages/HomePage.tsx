import { useNavigate } from 'react-router-dom'
import { MOCK_EPISODES } from '../domain/mockData'
import { EpisodeStatus } from '../domain/types'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { EPISODE_STATUS_BADGE, formatLocalDateTime } from '../domain/format'
import { EPISODE_STATUS_LABEL } from '../domain/types'
import './tool.css'

/** 대시보드 — 연출 진행 현황 요약(mock). */
export function HomePage(): React.JSX.Element {
  const navigate = useNavigate()

  const total = MOCK_EPISODES.length
  const inReview = MOCK_EPISODES.filter((e) => e.status === EpisodeStatus.REVIEWING).length
  const recording = MOCK_EPISODES.filter((e) => e.status === EpisodeStatus.RECORDING).length
  const adoptDone = MOCK_EPISODES.filter(
    (e) => e.totalAdoptableCount > 0 && e.adoptedLineCount >= e.totalAdoptableCount
  ).length

  const recent = [...MOCK_EPISODES]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 4)

  const stats = [
    { k: '연출 대상 회차', v: total },
    { k: '검수 중', v: inReview },
    { k: '녹음 중', v: recording },
    { k: '채택 완료', v: adoptDone }
  ]

  return (
    <div className="tool-page">
      <div className="tool-page__head">
        <div>
          <h2 className="tool-page__title">대시보드</h2>
          <p className="tool-page__desc">연출·제작 진행 현황 요약</p>
        </div>
        <MockNote />
      </div>

      <div className="tool-meta">
        {stats.map((s) => (
          <div key={s.k} className="tool-card tool-meta__item">
            <span className="tool-meta__k">{s.k}</span>
            <span className="tool-meta__v" style={{ fontSize: 26 }}>
              {s.v}
            </span>
          </div>
        ))}
      </div>

      <div className="tool-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>최근 수정 회차</strong>
          <button className="tool-btn tool-btn--ghost tool-btn--sm" onClick={() => navigate('/episodes')}>
            전체 보기 →
          </button>
        </div>
        <table className="tool-table">
          <thead>
            <tr>
              <th>작품 / 회차</th>
              <th>상태</th>
              <th>채택</th>
              <th>마지막 수정</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => {
              const badge = EPISODE_STATUS_BADGE[e.status]
              return (
                <tr
                  key={e.id}
                  className="is-clickable"
                  onClick={() => navigate(`/episodes/${e.id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 700 }}>{e.contentTitle}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      {e.episodeNo}화 · {e.title}
                    </div>
                  </td>
                  <td>
                    <Badge label={EPISODE_STATUS_LABEL[e.status]} {...badge} />
                  </td>
                  <td>
                    {e.adoptedLineCount}/{e.totalAdoptableCount}
                  </td>
                  <td style={{ color: '#64748b' }}>{formatLocalDateTime(e.updatedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
