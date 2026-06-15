import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchDirectorContent, fetchDirectorContentEpisodes } from '../api/directors'
import './ReviewContentPage.css'

/** EpisodeStatus(숫자) → 칩 라벨/색. (EpisodeMenuList 와 동일 팔레트) */
const EP_STATUS_META: Record<number, { label: string; color: string }> = {
  10: { label: '편집중', color: '#8c8c8c' },
  20: { label: '녹음 대기', color: '#1677ff' },
  30: { label: '녹음 중', color: '#722ed1' },
  40: { label: '검수 중', color: '#d97706' },
  60: { label: '발행', color: '#0f766e' }
}

/** TagColor(문자열) → 칩 색. (목록/maker 와 동일 팔레트) */
const TAG_COLOR_HEX: Record<string, string> = {
  RED: '#f5222d',
  ORANGE: '#fa8c16',
  GOLD: '#faad14',
  GREEN: '#52c41a',
  CYAN: '#13c2c2',
  BLUE: '#1677ff',
  INDIGO: '#2f54eb',
  PURPLE: '#722ed1',
  MAGENTA: '#eb2f96',
  GRAY: '#8c8c8c'
}

/** 렌더러 CSP 로 외부 썸네일이 막힐 때의 대체 이미지. */
function placeholder(title: string): string {
  const initial = title.trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#1e293b"/><text x="240" y="172" font-family="sans-serif" font-size="120" font-weight="800" fill="#475569" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** 전체 기준 구간 너비(%). */
function pct(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0
}

/**
 * 검수 — 콘텐츠 상세(회차 목록). 회차 클릭 → 검수 상세.
 * - hero:  GET /directors/contents/:id
 * - 회차:  GET /directors/contents/:contentId/episodes
 * 진행 요약은 회차 status(진행 중/검수 중/발행) 롤업. 회차 단위 '승인'은 제거됨
 * (승인은 (회차×성우) EpisodeReview 단위 — 추후 검수 화면 재설계 시 표시).
 */
export function ReviewContentPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { contentId } = useParams<{ contentId: string }>()
  const id = Number(contentId)
  const enabled = Number.isFinite(id)
  const fallbackTitle = (state as { title?: string } | null)?.title

  const contentQuery = useQuery({
    queryKey: ['director-content', id],
    queryFn: () => fetchDirectorContent(id),
    enabled,
    retry: false
  })
  const episodesQuery = useQuery({
    queryKey: ['director-content-episodes', id],
    queryFn: () => fetchDirectorContentEpisodes(id),
    enabled,
    retry: false
  })
  const content = contentQuery.data
  const episodes = useMemo(
    () => [...(episodesQuery.data?.items ?? [])].sort((a, b) => a.chapter - b.chapter),
    [episodesQuery.data]
  )

  // 회차 status 롤업: 진행 중(녹음대기/녹음중) · 검수 중(REVIEWING) · 발행(PUBLISHED).
  const counts = useMemo(() => {
    const c = { progress: 0, reviewing: 0, published: 0 }
    episodes.forEach((e) => {
      if (e.status === 40) c.reviewing += 1
      else if (e.status === 60) c.published += 1
      else c.progress += 1
    })
    return { ...c, total: episodes.length }
  }, [episodes])

  if (contentQuery.isError) {
    return (
      <div className="rc-empty">
        <p>콘텐츠를 불러오지 못했습니다. {(contentQuery.error as Error)?.message}</p>
        <button type="button" onClick={() => navigate('/review')}>
          검수 목록으로
        </button>
      </div>
    )
  }

  const title = content?.title ?? fallbackTitle ?? ''
  const total = counts.total
  const publishedPct = total > 0 ? Math.round((counts.published / total) * 100) : 0

  return (
    <div className="rc">
      <button type="button" className="rc__back" onClick={() => navigate('/review')}>
        ← 콘텐츠 목록
      </button>

      {/* Hero */}
      <section className="rc-hero">
        <img
          className="rc-hero__thumb"
          src={content?.thumbnailImageUrl || placeholder(title || '?')}
          alt={title}
          onError={(e) => {
            e.currentTarget.src = placeholder(title || '?')
          }}
        />
        <div className="rc-hero__info">
          <h2 className="rc-hero__title">{title || (contentQuery.isLoading ? '불러오는 중…' : '')}</h2>
          {content && content.tags.length > 0 && (
            <div className="rc-hero__tags">
              {content.tags.map((tag) => {
                const color = TAG_COLOR_HEX[tag.color] ?? TAG_COLOR_HEX.GRAY
                return (
                  <span
                    key={tag.id}
                    className="rc-chip"
                    style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
                  >
                    {tag.name}
                  </span>
                )
              })}
            </div>
          )}
          {content?.description && <p className="rc-hero__desc">{content.description}</p>}
        </div>
      </section>

      {/* 진행 요약 — 전체 기준 구간 분할 막대(진행 중/검수 중/발행) */}
      <section className="rc-summary">
        <div className="rc-summary__bar" role="img" aria-label={`전체 ${total}회차 중 진행 중 ${counts.progress}, 검수 중 ${counts.reviewing}, 발행 ${counts.published}`}>
          <div className="rc-summary__seg rc-summary__seg--progress" style={{ width: `${pct(counts.progress, total)}%` }} />
          <div className="rc-summary__seg rc-summary__seg--review" style={{ width: `${pct(counts.reviewing, total)}%` }} />
          <div className="rc-summary__seg rc-summary__seg--published" style={{ width: `${pct(counts.published, total)}%` }} />
        </div>
        <div className="rc-summary__stats">
          <span className="rc-stat">
            전체 <b>{total}</b>
          </span>
          <span className="rc-stat rc-stat--progress">
            <i className="rc-dot rc-dot--progress" />진행 중 <b>{counts.progress}</b>
          </span>
          <span className="rc-stat rc-stat--review">
            <i className="rc-dot rc-dot--review" />검수 중 <b>{counts.reviewing}</b>
          </span>
          <span className="rc-stat rc-stat--published">
            <i className="rc-dot rc-dot--published" />발행 <b>{counts.published}</b>
          </span>
          <span className="rc-summary__pct">발행 {publishedPct}%</span>
        </div>
      </section>

      {/* 회차 목록 */}
      <h3 className="rc-eps__heading">회차 {episodes.length}개</h3>

      {episodesQuery.isLoading && <p className="rc-msg">회차를 불러오는 중…</p>}
      {episodesQuery.isError && (
        <p className="rc-msg">회차를 불러오지 못했습니다. {(episodesQuery.error as Error)?.message}</p>
      )}
      {!episodesQuery.isLoading && !episodesQuery.isError && episodes.length === 0 && (
        <p className="rc-msg">등록된 회차가 없습니다.</p>
      )}

      <ul className="rc-eps">
        {episodes.map((ep) => {
          const s = EP_STATUS_META[ep.status]
          return (
            <li key={ep.id}>
              <button
                type="button"
                className="rc-ep"
                onClick={() => navigate(`/review/episodes/${ep.id}`)}
              >
                <span className="rc-ep__chapter">{ep.chapter}화</span>
                <span className="rc-ep__main">
                  <span className="rc-ep__title">{ep.title}</span>
                  <span className="rc-ep__meta">
                    컷 {ep.cutCount} · 대사 {ep.lineCount}
                  </span>
                </span>
                {s && (
                  <span
                    className="rc-ep__status"
                    style={{ color: s.color, backgroundColor: `${s.color}1a` }}
                  >
                    {s.label}
                  </span>
                )}
                <span className="rc-ep__chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
