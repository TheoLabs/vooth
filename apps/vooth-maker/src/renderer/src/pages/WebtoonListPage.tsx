import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContents } from '../features/contents/useContents'
import { CONTENT_STATUS_META, TAG_COLOR_HEX, type ContentListItem } from '../api/contents.api'
import './WebtoonListPage.css'

/** 색상 칩(상태/태그). 배경은 옅은 틴트, 글자/테두리는 진한 색. */
function Chip({ color, children }: { color: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="wt-chip" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}>
      {children}
    </span>
  )
}

/** 렌더러 CSP(img-src 'self' data:) 로 외부 썸네일이 막힐 때의 대체 이미지. */
function placeholder(title: string): string {
  const initial = title.trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#e2e8f0"/><text x="240" y="170" font-family="sans-serif" font-size="120" font-weight="800" fill="#94a3b8" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function ContentCard({ content }: { content: ContentListItem }): React.JSX.Element {
  const navigate = useNavigate()
  const statusMeta = CONTENT_STATUS_META[content.status]

  return (
    <button
      type="button"
      className="wt-card"
      onClick={() => navigate(`/webtoons/${content.id}`, { state: { content } })}
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

export function WebtoonListPage(): React.JSX.Element {
  const [keyword, setKeyword] = useState('')
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useContents()

  // 게시 필터는 서버(RecordableContentSpec). 검색은 화면(제목·설명) — 로드된 페이지 기준.
  const items = useMemo(() => {
    const list = data?.pages.flatMap((page) => page.items) ?? []
    const q = keyword.trim()
    if (!q) return list
    return list.filter((c) => c.title.includes(q) || (c.description?.includes(q) ?? false))
  }, [data, keyword])

  // 하단 sentinel 이 보이면 다음 페이지 로드(무한 스크롤).
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length])

  return (
    <div className="wt-list">
      <div className="wt-list__intro">
        <h2 className="wt-list__heading">콘텐츠</h2>
        <p className="wt-list__subtitle">게시된 작품을 둘러보세요.</p>
      </div>

      <input
        className="wt-list__search"
        type="search"
        placeholder="작품 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {isLoading && <p className="wt-list__empty">불러오는 중…</p>}
      {isError && <p className="wt-list__empty">목록을 불러오지 못했습니다. {error?.message}</p>}

      {!isLoading && !isError &&
        (items.length === 0 ? (
          <p className="wt-list__empty">
            {keyword ? '검색 결과가 없습니다.' : '게시된 콘텐츠가 없습니다.'}
          </p>
        ) : (
          <>
            <div className="wt-list__grid">
              {items.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
            {/* 무한 스크롤 sentinel + 추가 로딩 표시 */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {isFetchingNextPage && <p className="wt-list__empty">더 불러오는 중…</p>}
          </>
        ))}
    </div>
  )
}
