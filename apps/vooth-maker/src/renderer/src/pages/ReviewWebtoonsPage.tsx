import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReview } from '../features/review/ReviewContext'
import { episodeReviewStat } from '../features/review/reviewState'
import { getWebtoonById } from '../mocks/webtoons.mock'
import './WebtoonListPage.css'

interface ReviewWebtoonGroup {
  webtoonId: string
  title: string
  thumbnailUrl?: string
  episodeCount: number
  pendingTakes: number
}

export function ReviewWebtoonsPage(): React.JSX.Element {
  const { episodes } = useReview()
  const navigate = useNavigate()

  const groups = useMemo<ReviewWebtoonGroup[]>(() => {
    const byId = new Map<string, ReviewWebtoonGroup>()
    episodes.forEach((ep) => {
      const stat = episodeReviewStat(ep)
      if (stat.lines === 0) return // 검수할 녹음이 없는 회차 제외
      const g =
        byId.get(ep.webtoonId) ??
        ({
          webtoonId: ep.webtoonId,
          title: ep.webtoonTitle,
          thumbnailUrl: getWebtoonById(ep.webtoonId)?.thumbnailUrl,
          episodeCount: 0,
          pendingTakes: 0
        } satisfies ReviewWebtoonGroup)
      g.episodeCount += 1
      g.pendingTakes += stat.pendingTakes
      byId.set(ep.webtoonId, g)
    })
    return [...byId.values()].sort((a, b) => b.pendingTakes - a.pendingTakes)
  }, [episodes])

  return (
    <div className="wt-list">
      <div className="wt-list__intro">
        <h2 className="wt-list__heading">검수</h2>
        <p className="wt-list__subtitle">검수할 작품을 선택하세요. 작품을 열면 회차 목록이 보여요.</p>
      </div>

      <p className="wt-list__mock-note">⚠️ 임시(mock) 데이터이며, 검수 결과는 세션 로컬로만 반영됩니다(저장 안 됨).</p>

      {groups.length === 0 ? (
        <p className="wt-list__subtitle">검수할 녹음이 있는 작품이 없습니다.</p>
      ) : (
        <div className="wt-list__grid">
          {groups.map((g) => (
            <button
              key={g.webtoonId}
              type="button"
              className="wt-card"
              onClick={() => navigate(`/review/webtoons/${g.webtoonId}`)}
            >
              {g.thumbnailUrl && <img className="wt-card__thumb" src={g.thumbnailUrl} alt={g.title} />}
              <div className="wt-card__body">
                <span className="wt-card__title">{g.title}</span>
                <span className="wt-card__count">회차 {g.episodeCount}개</span>
                {g.pendingTakes > 0 ? (
                  <span className="wt-card__pending">검수 대기 {g.pendingTakes}건</span>
                ) : (
                  <span className="wt-card__pending wt-card__pending--clear">검수 대기 없음</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
