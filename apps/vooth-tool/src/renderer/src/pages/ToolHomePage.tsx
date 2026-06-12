import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchDirectorEpisodes } from '../api/directors'
import './ToolHomePage.css'

/**
 * vooth-tool 연출·제작 홈 — 연출할 회차 목록(directors API).
 * 컷/대사는 back-office 등록, 녹음은 vooth-maker. 이 도구는 연출/제작.
 */
export function ToolHomePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['director-episodes'],
    queryFn: fetchDirectorEpisodes,
    retry: false
  })

  const items = data?.items ?? []

  return (
    <div className="th">
      <div className="th__intro">
        <h2 className="th__heading">연출 · 제작</h2>
        <p className="th__subtitle">회차를 골라 대사 위치·간격·머무름을 연출하고 연속 스크롤로 미리봅니다.</p>
      </div>

      {isLoading && <p className="th__msg">불러오는 중…</p>}
      {isError && <p className="th__msg">회차를 불러오지 못했습니다. {(error as Error)?.message}</p>}
      {!isLoading && !isError && items.length === 0 && <p className="th__msg">연출할 회차가 없습니다.</p>}

      <div className="th__grid">
        {items.map((ep) => (
          <button key={ep.id} type="button" className="th-card" onClick={() => navigate(`/episodes/${ep.id}`)}>
            <span className="th-card__content">{ep.contentTitle}</span>
            <span className="th-card__title">
              <span className="th-card__chapter">{ep.chapter}화</span>
              {ep.title}
            </span>
            <span className="th-card__meta">
              컷 {ep.cutCount}개 · 대사 {ep.lineCount}개
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
