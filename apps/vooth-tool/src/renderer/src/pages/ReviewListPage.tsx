import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchDirectorContents, type DirectorContentItem } from '../api/directors'
import './ReviewListPage.css'

/** 콘텐츠 상태 칩 라벨/색. (maker 와 동일 팔레트) */
const CONTENT_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: '편집중', color: '#8c8c8c' },
  recording: { label: '녹음 대기', color: '#1677ff' },
  scheduled: { label: '발행 예정', color: '#faad14' },
  published: { label: '발행', color: '#52c41a' },
  archived: { label: '아카이브', color: '#8c8c8c' }
}

/** TagColor(문자열) → 칩 색. (maker 와 동일 팔레트) */
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

/** 색상 칩(상태/태그). 배경은 옅은 틴트, 글자/테두리는 진한 색. */
function Chip({ color, children }: { color: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="wt-chip" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}>
      {children}
    </span>
  )
}

/** 렌더러 CSP 로 외부 썸네일이 막힐 때의 대체 이미지. */
function placeholder(title: string): string {
  const initial = title.trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#e2e8f0"/><text x="240" y="170" font-family="sans-serif" font-size="120" font-weight="800" fill="#94a3b8" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function ContentCard({ content }: { content: DirectorContentItem }): React.JSX.Element {
  const navigate = useNavigate()
  const statusMeta = CONTENT_STATUS_META[content.status]

  return (
    <button
      type="button"
      className="wt-card"
      onClick={() => navigate(`/review/contents/${content.id}`, { state: { title: content.title } })}
    >
      <div className="wt-card__thumb-wrap">
        <img
          className="wt-card__thumb"
          src={content.thumbnailImageUrl || placeholder(content.title)}
          alt={content.title}
          onError={(e) => {
            e.currentTarget.src = placeholder(content.title)
          }}
        />
        {statusMeta && (
          <span className="wt-card__status" style={{ backgroundColor: statusMeta.color }}>
            {statusMeta.label}
          </span>
        )}
      </div>
      <div className="wt-card__body">
        <span className="wt-card__title">{content.title}</span>
        {content.description && <span className="wt-card__desc">{content.description}</span>}
        {content.tags?.length > 0 && (
          <div className="wt-card__chips">
            {content.tags.map((tag) => (
              <Chip key={tag.id} color={TAG_COLOR_HEX[tag.color] ?? '#8c8c8c'}>
                {tag.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

/**
 * 검수 — 콘텐츠 목록(directors content API). 콘텐츠 클릭 → 콘텐츠 상세(회차 목록).
 */
export function ReviewListPage(): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')

  // 입력 디바운스(300ms) — 타이핑마다 요청하지 않는다.
  useEffect(() => {
    const t = setTimeout(() => setTitle(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['director-contents', title],
    queryFn: () => fetchDirectorContents({ title }),
    retry: false
  })
  const items = data?.items ?? []

  return (
    <div className="wt-list">
      <div className="wt-list__intro">
        <h2 className="wt-list__heading">검수</h2>
        <p className="wt-list__subtitle">콘텐츠를 골라 회차별로 검수합니다.</p>
      </div>

      <input
        className="wt-list__search"
        type="search"
        placeholder="제목으로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && <p className="wt-list__empty">불러오는 중…</p>}
      {isError && <p className="wt-list__empty">콘텐츠를 불러오지 못했습니다. {(error as Error)?.message}</p>}

      {!isLoading && !isError &&
        (items.length === 0 ? (
          <p className="wt-list__empty">
            {title ? `'${title}' 검색 결과가 없습니다.` : '검수할 콘텐츠가 없습니다.'}
          </p>
        ) : (
          <div className="wt-list__grid">
            {items.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ))}
    </div>
  )
}
