import { useNavigate } from 'react-router-dom'
import { MOCK_WEBTOONS, getEpisodeCount } from '../mocks/webtoons.mock'
import type { Webtoon } from '../types/domain'
import './WebtoonListPage.css'

function WebtoonCard({ webtoon }: { webtoon: Webtoon }): React.JSX.Element {
  const navigate = useNavigate()
  const episodeCount = getEpisodeCount(webtoon.id)

  return (
    <button
      type="button"
      className="wt-card"
      onClick={() => navigate(`/webtoons/${webtoon.id}`)}
    >
      <img className="wt-card__thumb" src={webtoon.thumbnailUrl} alt={webtoon.title} />
      <div className="wt-card__body">
        <span className="wt-card__title">{webtoon.title}</span>
        {webtoon.description && <span className="wt-card__desc">{webtoon.description}</span>}
        <span className="wt-card__count">에피소드 {episodeCount}개</span>
      </div>
    </button>
  )
}

export function WebtoonListPage(): React.JSX.Element {
  return (
    <div className="wt-list">
      <div className="wt-list__intro">
        <h2 className="wt-list__heading">콘텐츠</h2>
        <p className="wt-list__subtitle">제작 중인 작품과 회차를 둘러보세요.</p>
      </div>

      <p className="wt-list__mock-note">
        ⚠️ 표시된 데이터는 실제 데이터가 아닌 임시(mock) 샘플입니다.
      </p>

      <div className="wt-list__grid">
        {MOCK_WEBTOONS.map((webtoon) => (
          <WebtoonCard key={webtoon.id} webtoon={webtoon} />
        ))}
      </div>
    </div>
  )
}
