import { useNavigate } from 'react-router-dom'
import { MOCK_EPISODES } from '../mocks/director.mock'
import './EpisodeMenuList.css'

const STATUS_META: Record<string, { label: string; color: string }> = {
  review: { label: '검수 대기', color: '#faad14' },
  approved: { label: '승인', color: '#52c41a' },
  rejected: { label: '반려', color: '#f5222d' }
}

/** 검수/렌더 메뉴용 회차 목록(mock). 카드 클릭 시 basePath/:id 로 이동. */
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

  return (
    <div className="eml">
      <h2 className="eml__heading">{heading}</h2>
      <p className="eml__subtitle">{subtitle}</p>
      <p className="eml__note">⚠️ mock 데이터</p>

      <div className="eml__grid">
        {MOCK_EPISODES.map((ep) => {
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
