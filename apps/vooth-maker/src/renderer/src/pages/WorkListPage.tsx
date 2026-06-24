import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTENT_STATUS_LABEL } from '../api/content.api'
import { useInfiniteCreatorContents } from '../features/content/useCreatorContents'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import './WorkListPage.css'

/** 썸네일 없는 작품의 플레이스홀더 배경색(작품별 다양성). */
const PH_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6']

/** 작업 목록 = 내 작업 작품 목록(GET /creators/contents). 작품을 골라 회차 녹음으로 진행. */
export function WorkListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // 입력은 즉시 반영, 질의는 멈춘 뒤 300ms 후.
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  // 보기 방식(그리드/테이블, localStorage 유지). 그리드는 한 줄 10개 고정.
  const [view, setView] = useState<'grid' | 'table'>(() =>
    localStorage.getItem('vooth-maker.workView') === 'table' ? 'table' : 'grid'
  )
  useEffect(() => {
    localStorage.setItem('vooth-maker.workView', view)
  }, [view])

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteCreatorContents(debouncedQuery || undefined)

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
    <div className="wl">
      <div className="wl__head">
        <h2 className="wl__title">내 콘텐츠</h2>
        <span className="wl__total">총 {total}건</span>
      </div>

      <div className="wl__toolbar">
        <input
          className="wl__search"
          type="text"
          placeholder="작품 제목 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="wl__viewtoggle">
          <button
            type="button"
            className={`wl__viewbtn${view === 'grid' ? ' wl__viewbtn--active' : ''}`}
            onClick={() => setView('grid')}
          >
            ▦ 그리드
          </button>
          <button
            type="button"
            className={`wl__viewbtn${view === 'table' ? ' wl__viewbtn--active' : ''}`}
            onClick={() => setView('table')}
          >
            ☰ 테이블
          </button>
        </div>
      </div>

      {isLoading && <div className="wl__state">불러오는 중…</div>}
      {isError && !isLoading && (
        <div className="wl__state wl__state--error">
          목록을 불러오지 못했습니다. {error?.message}
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <div className="wl__state">배정된 작품이 없습니다.</div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          {view === 'grid' ? (
            <div className="wl-grid" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
              {items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="wl-card"
                  onClick={() => navigate(`/works/contents/${c.id}`, { state: { content: c } })}
                >
                  <div
                    className="wl-card__thumb"
                    style={
                      c.thumbnailUrl
                        ? undefined
                        : { background: PH_COLORS[c.id % PH_COLORS.length] }
                    }
                  >
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt="" draggable={false} loading="lazy" />
                    ) : (
                      <span className="wl-card__ph wl-card__ph--filled">{c.title.slice(0, 1)}</span>
                    )}
                    {!!c.pendingEpisodeCount && (
                      <span className="wl-card__badge">녹음 {c.pendingEpisodeCount}</span>
                    )}
                  </div>
                  <div className="wl-card__body">
                    <div className="wl-card__title">{c.title}</div>
                    {!!c.tags?.length && (
                      <div className="wl-tags">
                        {c.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="wl-tag"
                            style={{ color: t.color, borderColor: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="wl-card__meta">
                      {c.status && (
                        <span className="wl-card__status">
                          {CONTENT_STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      )}
                      <span className="wl-card__count">회차 {c.episodeCount ?? '-'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <table className="wl-table">
              <thead>
                <tr>
                  <th className="wl-table__thumbcol" aria-label="썸네일" />
                  <th>작품</th>
                  <th>녹음 필요</th>
                  <th>상태</th>
                  <th>회차 수</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="wl-table__row"
                    onClick={() => navigate(`/works/contents/${c.id}`, { state: { content: c } })}
                  >
                    <td className="wl-table__thumbcol">
                      <span
                        className="wl-table__thumb"
                        style={
                          c.thumbnailUrl
                            ? undefined
                            : { background: PH_COLORS[c.id % PH_COLORS.length] }
                        }
                      >
                        {c.thumbnailUrl ? (
                          <img src={c.thumbnailUrl} alt="" draggable={false} loading="lazy" />
                        ) : (
                          c.title.slice(0, 1)
                        )}
                      </span>
                    </td>
                    <td className="wl-table__title">
                      <div>{c.title}</div>
                      {!!c.tags?.length && (
                        <div className="wl-tags">
                          {c.tags.slice(0, 4).map((t) => (
                            <span
                              key={t.id}
                              className="wl-tag"
                              style={{ color: t.color, borderColor: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {typeof c.pendingEpisodeCount === 'number' ? (
                        c.pendingEpisodeCount > 0 ? (
                          <span className="wl-pending">{c.pendingEpisodeCount}</span>
                        ) : (
                          '0'
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {c.status ? (
                        <span className="wl-status">
                          {CONTENT_STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{c.episodeCount ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div ref={sentinelRef} />
          {isFetchingNextPage && <div className="wl__state">더 불러오는 중…</div>}
        </>
      )}
    </div>
  )
}
