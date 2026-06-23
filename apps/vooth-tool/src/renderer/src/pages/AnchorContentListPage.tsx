import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteDirectorContents } from '../features/content/useDirectorContents'
import { CONTENT_STATUS_LABEL } from '../api/content.api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import './tool.css'
import './content.css'

/**
 * 컨텐츠(작품) — 1단계: 작품 선택. GET /directors/contents 무한 스크롤 연동.
 * 작품 카드를 고르면 작품 상세(/anchors/contents/:id)에서 하단 회차 탭을 본다.
 */
export function AnchorContentListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  // 입력은 즉시 반영하되, 질의는 멈춘 뒤 300ms 후에만(요청 폭주 방지).
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteDirectorContents(debouncedSearch || undefined)

  const items = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? items.length

  // 그리드 끝 센티넬이 보이면 다음 페이지 로드.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="tool-page">
      <div className="tool-page__head">
        <div>
          <h2 className="tool-page__title">컨텐츠</h2>
          <p className="tool-page__desc">작품을 골라 회차별로 작업합니다.</p>
        </div>
      </div>

      <div className="tool-toolbar">
        <input
          className="tool-input"
          placeholder="작품 제목 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <div className="tool-toolbar__spacer" />
        <span className="tool-count">
          총 <strong>{total}</strong>건
        </span>
      </div>

      {isLoading && <div className="ct-state">불러오는 중…</div>}
      {isError && !isLoading && (
        <div className="ct-state ct-state--error">목록을 불러오지 못했습니다. {error?.message}</div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <div className="ct-state">조건에 맞는 작품이 없습니다.</div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          <div className="ct-grid">
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                className="ct-card"
                onClick={() => navigate(`/anchors/contents/${c.id}`, { state: { content: c } })}
              >
                <div className="ct-card__thumb">
                  {c.thumbnailUrl ? (
                    <img
                      className="ct-card__thumb-img"
                      src={c.thumbnailUrl}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    <span className="ct-card__ph">▦</span>
                  )}
                </div>
                <div className="ct-card__body">
                  <div className="ct-card__title">{c.title}</div>
                  <div className="ct-card__meta">
                    <span className="ct-chip">{CONTENT_STATUS_LABEL[c.status] ?? c.status}</span>
                    <span className="ct-card__count">회차 {c.episodeCount ?? '-'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 무한 스크롤 센티넬 + 추가 로딩 표시 */}
          <div ref={sentinelRef} />
          {isFetchingNextPage && <div className="ct-state">더 불러오는 중…</div>}
        </>
      )}
    </div>
  )
}
