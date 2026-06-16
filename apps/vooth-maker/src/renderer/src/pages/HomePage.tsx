import { useMe } from '../features/me/useMe'
import {
  EPISODE_STATUS_LABEL,
  EPISODE_STATUS_VARIANT,
  MOCK_EPISODES,
  summarize,
  type Episode,
} from '../features/episodes/episode.types'
import './HomePage.css'

/** UTC ISO → 'M월 D일' */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function StatusPill({ episode }: { episode: Episode }): React.JSX.Element {
  return (
    <span className={`status-pill status-pill--${EPISODE_STATUS_VARIANT[episode.status]}`}>
      {EPISODE_STATUS_LABEL[episode.status]}
    </span>
  )
}

/** 상태에 따른 1차 액션 라벨/활성 여부 (현재 mock — 클릭 동작은 추후 연결) */
function primaryAction(episode: Episode): { label: string; disabled: boolean } {
  switch (episode.status) {
    case 'READY':
      return { label: '녹음 시작', disabled: false }
    case 'RECORDING':
      return episode.recordedCuts >= episode.totalCuts
        ? { label: '검수 요청', disabled: false }
        : { label: '이어서 녹음', disabled: false }
    case 'REVIEWING':
      return { label: '검수 대기 중', disabled: true }
    case 'PUBLISHED':
      return { label: '발행 완료', disabled: true }
  }
}

function EpisodeCard({ episode }: { episode: Episode }): React.JSX.Element {
  const progress = episode.totalCuts
    ? Math.round((episode.recordedCuts / episode.totalCuts) * 100)
    : 0
  const action = primaryAction(episode)

  return (
    <li className="ep-card">
      <div className="ep-card__head">
        <div className="ep-card__titles">
          <span className="ep-card__work">{episode.workTitle}</span>
          <span className="ep-card__title">
            {episode.episodeNo}화 · {episode.title}
          </span>
        </div>
        <StatusPill episode={episode} />
      </div>

      <div className="ep-card__meta">
        <span className="ep-card__role">🎭 {episode.role}</span>
        <span className="ep-card__due">마감 {formatDate(episode.dueDate)}</span>
      </div>

      <div className="ep-card__progress">
        <div className="ep-progress">
          <div className="ep-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="ep-card__count">
          {episode.recordedCuts}/{episode.totalCuts} 컷
        </span>
      </div>

      {episode.rejectionNote && (
        <p className="ep-card__reject">
          <strong>검수 반려</strong> {episode.rejectionNote}
        </p>
      )}

      <div className="ep-card__actions">
        <button type="button" className="ep-btn ep-btn--primary" disabled={action.disabled}>
          {action.label}
        </button>
        <button type="button" className="ep-btn">
          상세
        </button>
      </div>
    </li>
  )
}

/** 홈 = 배정된 회차 대시보드 (현재 mock 데이터). */
export function HomePage(): React.JSX.Element {
  const { data: account } = useMe()
  const episodes = MOCK_EPISODES
  const summary = summarize(episodes)
  const greetingName = account?.name ?? '성우님'

  return (
    <div className="home">
      <div className="home__greeting">
        <h2 className="home__title">{greetingName}님, 오늘도 좋은 녹음 되세요 🎙️</h2>
        <span className="home__mock-tag">MOCK</span>
      </div>

      <section className="home__summary">
        {summary.map((s) => (
          <div
            key={s.status}
            className={`summary-card summary-card--${EPISODE_STATUS_VARIANT[s.status]}`}
          >
            <span className="summary-card__count">{s.count}</span>
            <span className="summary-card__label">{EPISODE_STATUS_LABEL[s.status]}</span>
          </div>
        ))}
      </section>

      <section className="home__list">
        <h3 className="home__list-title">내 작업</h3>
        <ul className="ep-list">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </ul>
      </section>
    </div>
  )
}
