import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fetchDirectorContent,
  fetchDirectorContentEpisodes,
  fetchDirectorContentEpisodeStats
} from '../api/directors'
import './ReviewContentPage.css'

/** EpisodeStatus(숫자) → 칩 라벨/색. (EpisodeMenuList 와 동일 팔레트) */
const EP_STATUS_META: Record<number, { label: string; color: string }> = {
  10: { label: '편집중', color: '#8c8c8c' },
  20: { label: '녹음 대기', color: '#1677ff' },
  30: { label: '녹음 중', color: '#722ed1' },
  40: { label: '검수 대기', color: '#d97706' },
  50: { label: '승인', color: '#16a34a' },
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

/** stats 핸들러가 아직 목록을 돌려줄 수 있어, 값이 숫자가 아니면 목록에서 계산한 값으로 대체. */
function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** 전체 기준 구간 너비(%). */
function pct(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0
}

/**
 * 검수 — 콘텐츠 상세(회차 목록). 회차 클릭 → 검수 상세.
 * - hero:  GET /directors/contents/:id
 * - 회차:  GET /directors/contents/:contentId/episodes
 * - 집계:  GET /directors/contents/:contentId/episodes/stats
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
  const statsQuery = useQuery({
    queryKey: ['director-content-episode-stats', id],
    queryFn: () => fetchDirectorContentEpisodeStats(id),
    enabled,
    retry: false
  })

  const content = contentQuery.data
  const episodes = useMemo(
    () => [...(episodesQuery.data?.items ?? [])].sort((a, b) => a.chapter - b.chapter),
    [episodesQuery.data]
  )

  // stats API 우선, 미제공 시 목록에서 계산(컨트롤러 버그 대비).
  const counts = useMemo(() => {
    const derived = { approved: 0, review: 0, progress: 0 }
    episodes.forEach((e) => {
      if (e.status === 50 || e.status === 60) derived.approved += 1
      else if (e.status === 40) derived.review += 1
      else derived.progress += 1
    })
    const s = statsQuery.data
    return {
      total: num(s?.total, episodes.length),
      approved: num(s?.approved, derived.approved),
      review: num(s?.reviewing, derived.review),
      progress: num(s?.ready, derived.progress)
    }
  }, [episodes, statsQuery.data])

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
  const approvedPct = total > 0 ? Math.round((counts.approved / total) * 100) : 0

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

      {/* 진행 요약 — 전체 기준 구간 분할 막대(승인/검수 대기/진행 중) */}
      <section className="rc-summary">
        <div className="rc-summary__bar" role="img" aria-label={`전체 ${total}회차 중 승인 ${counts.approved}, 검수 대기 ${counts.review}, 진행 중 ${counts.progress}`}>
          <div className="rc-summary__seg rc-summary__seg--approved" style={{ width: `${pct(counts.approved, total)}%` }} />
          <div className="rc-summary__seg rc-summary__seg--review" style={{ width: `${pct(counts.review, total)}%` }} />
          <div className="rc-summary__seg rc-summary__seg--progress" style={{ width: `${pct(counts.progress, total)}%` }} />
        </div>
        <div className="rc-summary__stats">
          <span className="rc-stat">
            전체 <b>{total}</b>
          </span>
          <span className="rc-stat rc-stat--approved">
            <i className="rc-dot rc-dot--approved" />승인 <b>{counts.approved}</b>
          </span>
          <span className="rc-stat rc-stat--review">
            <i className="rc-dot rc-dot--review" />검수 대기 <b>{counts.review}</b>
          </span>
          <span className="rc-stat rc-stat--progress">
            <i className="rc-dot rc-dot--progress" />진행 중 <b>{counts.progress}</b>
          </span>
          <span className="rc-summary__pct">승인 {approvedPct}%</span>
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
