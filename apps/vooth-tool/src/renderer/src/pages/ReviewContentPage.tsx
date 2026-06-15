import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getMockContent, type ReviewStatus } from '../mocks/director.mock'
import './ReviewContentPage.css'

const STATUS_META: Record<ReviewStatus, { label: string; color: string }> = {
  review: { label: '검수 대기', color: '#faad14' },
  approved: { label: '승인', color: '#16a34a' },
  rejected: { label: '반려', color: '#dc2626' }
}

/**
 * 검수 — 콘텐츠 상세(회차 목록). 회차 클릭 → 검수 상세.
 */
export function ReviewContentPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { contentId } = useParams<{ contentId: string }>()
  const content = useMemo(() => getMockContent(Number(contentId)), [contentId])
  const title = (state as { title?: string } | null)?.title ?? content?.title ?? ''

  if (!content) {
    return (
      <div className="rc-empty">
        <p>콘텐츠를 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/review')}>
          검수 목록으로
        </button>
      </div>
    )
  }

  const approved = content.episodes.filter((e) => e.status === 'approved').length

  return (
    <div className="rc">
      <button type="button" className="rc__back" onClick={() => navigate('/review')}>
        ← 콘텐츠 목록
      </button>
      <header className="rc__header">
        <h2 className="rc__title">{title}</h2>
        <span className="rc__progress">
          승인 {approved}/{content.episodes.length}
        </span>
      </header>

      <div className="rc__eps">
        {content.episodes.map((ep) => {
          const s = STATUS_META[ep.status]
          return (
            <button key={ep.id} type="button" className="rc-ep" onClick={() => navigate(`/review/episodes/${ep.id}`)}>
              <span className="rc-ep__top">
                <span className="rc-ep__chapter">{ep.chapter}화</span>
                <span className="rc-ep__status" style={{ color: s.color, background: `${s.color}1a` }}>
                  {s.label}
                </span>
              </span>
              <span className="rc-ep__title">{ep.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
