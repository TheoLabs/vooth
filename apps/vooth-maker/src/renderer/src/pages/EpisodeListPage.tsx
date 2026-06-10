import { Link, useNavigate, useParams } from 'react-router-dom'
import { getWebtoonById, getEpisodesByWebtoonId } from '../mocks/webtoons.mock'
import { buildTimeline, formatMs } from '../lib/timeline'
import type { Episode } from '../types/domain'
import './WorkListPage.css'

function getProgress(episode: Episode): { total: number; done: number; percent: number } {
  const lines = episode.cuts.flatMap((cut) => cut.lines)
  const total = lines.length
  const done = lines.filter((line) => line.recordings.some((r) => r.status === 'DONE')).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, percent }
}

function EpisodeCard({ episode }: { episode: Episode }): React.JSX.Element {
  const navigate = useNavigate()
  const progress = getProgress(episode)
  const totalMs = buildTimeline(episode).totalMs
  const statusKey = progress.done === 0 ? 'pending' : progress.done === progress.total ? 'done' : 'in_progress'
  const statusLabel = statusKey === 'pending' ? '대기' : statusKey === 'done' ? '완료' : '녹음 중'

  return (
    <button type="button" className="work-card" onClick={() => navigate(`/episodes/${episode.id}`)}>
      <div className="work-card__head">
        <span className="work-card__webtoon">{episode.episodeNo}화</span>
        <span className={`work-card__status work-card__status--${statusKey}`}>{statusLabel}</span>
      </div>

      <p className="work-card__title">{episode.title}</p>

      <div className="work-card__progress">
        <div className="work-card__progress-bar">
          <div className="work-card__progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="work-card__progress-text">
          완료 {progress.done}/{progress.total} 대사 · {progress.percent}%
        </span>
      </div>

      <div className="work-card__playtime">
        <span className="work-card__playtime-label">예상 재생 시간</span>
        <span className="work-card__playtime-value">{formatMs(totalMs)}</span>
      </div>
    </button>
  )
}

export function EpisodeListPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const webtoon = id ? getWebtoonById(id) : undefined
  const episodes = id ? getEpisodesByWebtoonId(id) : []

  if (!webtoon) {
    return (
      <div className="work-list">
        <p className="work-list__mock-note">작품을 찾을 수 없습니다.</p>
        <Link className="work-list__back" to="/webtoons">
          ← 콘텐츠 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="work-list">
      <div className="work-list__intro">
        <Link className="work-list__back" to="/webtoons">
          ← 콘텐츠 목록으로
        </Link>
        <h2 className="work-list__heading">{webtoon.title}</h2>
        {webtoon.description && <p className="work-list__subtitle">{webtoon.description}</p>}
      </div>

      {episodes.length === 0 ? (
        <p className="work-list__empty">등록된 에피소드가 없습니다. (준비중)</p>
      ) : (
        <div className="work-list__grid">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </div>
  )
}
