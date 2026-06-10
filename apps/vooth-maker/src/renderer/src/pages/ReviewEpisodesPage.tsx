import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useReview } from '../features/review/ReviewContext'
import { episodeReviewStat } from '../features/review/reviewState'
import { getWebtoonById } from '../mocks/webtoons.mock'
import type { Episode } from '../types/domain'
import './WorkListPage.css'

function EpisodeCard({ episode, approved }: { episode: Episode; approved: boolean }): React.JSX.Element {
  const navigate = useNavigate()
  const stat = episodeReviewStat(episode)
  const statusKey = approved ? 'done' : stat.pendingTakes > 0 ? 'pending' : 'in_progress'
  const statusLabel = approved ? '최종 승인됨' : stat.pendingTakes > 0 ? `대기 ${stat.pendingTakes}건` : '검수 가능'

  return (
    <button type="button" className="work-card" onClick={() => navigate(`/review/episodes/${episode.id}`)}>
      <div className="work-card__head">
        <span className="work-card__webtoon">{episode.episodeNo}화</span>
        <span className={`work-card__status work-card__status--${statusKey}`}>{statusLabel}</span>
      </div>

      <p className="work-card__title">{episode.title}</p>

      <div className="work-card__progress">
        <div className="work-card__progress-bar">
          <div
            className="work-card__progress-fill"
            style={{ width: `${stat.lines > 0 ? Math.round((stat.resolved / stat.lines) * 100) : 0}%` }}
          />
        </div>
        <span className="work-card__progress-text">
          확정 {stat.resolved}/{stat.lines} 대사
        </span>
      </div>
    </button>
  )
}

export function ReviewEpisodesPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const { episodes, approvedIds } = useReview()
  const webtoon = id ? getWebtoonById(id) : undefined

  const eps = useMemo(
    () =>
      episodes
        .filter((e) => e.webtoonId === id && episodeReviewStat(e).lines > 0)
        .sort((a, b) => a.episodeNo - b.episodeNo),
    [episodes, id]
  )

  return (
    <div className="work-list">
      <div className="work-list__intro">
        <Link className="work-list__back" to="/review">
          ← 검수 작품 목록으로
        </Link>
        <h2 className="work-list__heading">{webtoon?.title ?? '작품'} · 검수</h2>
        <p className="work-list__subtitle">검수할 회차를 선택하세요.</p>
      </div>

      {eps.length === 0 ? (
        <p className="work-list__empty">검수할 녹음이 있는 회차가 없습니다.</p>
      ) : (
        <div className="work-list__grid">
          {eps.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} approved={approvedIds.has(ep.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
