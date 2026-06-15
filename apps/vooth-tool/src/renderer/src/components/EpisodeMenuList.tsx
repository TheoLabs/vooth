import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchDirectorEpisodes } from '../api/directors'
import './EpisodeMenuList.css'

/** EpisodeStatus(숫자) → 칩 라벨/색. */
const STATUS_META: Record<number, { label: string; color: string }> = {
  10: { label: '편집중', color: '#8c8c8c' },
  20: { label: '녹음 대기', color: '#1677ff' },
  30: { label: '녹음 중', color: '#722ed1' },
  40: { label: '검수', color: '#faad14' },
  50: { label: '승인', color: '#52c41a' },
  60: { label: '발행', color: '#16a34a' }
}

/** 검수/렌더 메뉴용 회차 목록(directors 회차 목록 API). 카드 클릭 시 basePath/:id 로 이동. */
export function EpisodeMenuList({
  basePath,
  heading,
  subtitle
}: {
  basePath: string
  heading: string
  subtitle: string
}): React.JSX.Element {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['director-episodes'],
    queryFn: fetchDirectorEpisodes,
    retry: false
  })
  const items = data?.items ?? []

  return (
    <div className="eml">
      <h2 className="eml__heading">{heading}</h2>
      <p className="eml__subtitle">{subtitle}</p>

      {isLoading && <p className="eml__msg">불러오는 중…</p>}
      {isError && <p className="eml__msg">회차를 불러오지 못했습니다. {(error as Error)?.message}</p>}
      {!isLoading && !isError && items.length === 0 && <p className="eml__msg">회차가 없습니다.</p>}

      <div className="eml__grid">
        {items.map((ep) => {
          const s = STATUS_META[ep.status]
          return (
            <button key={ep.id} type="button" className="eml-card" onClick={() => navigate(`${basePath}/${ep.id}`)}>
              <span className="eml-card__top">
                <span className="eml-card__content">{ep.contentTitle}</span>
                {s && (
                  <span className="eml-card__status" style={{ color: s.color, background: `${s.color}1a` }}>
                    {s.label}
                  </span>
                )}
              </span>
              <span className="eml-card__title">
                <span className="eml-card__chapter">{ep.chapter}화</span>
                {ep.title}
              </span>
              <span className="eml-card__meta">
                컷 {ep.cutCount}개 · 대사 {ep.lineCount}개
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
