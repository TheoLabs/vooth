import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CONTENT_STATUS_LABEL, type CreatorContent } from '../api/content.api'
import { useCreatorContent } from '../features/content/useCreatorContents'
import { useCreatorEpisodes } from '../features/episodes/useCreatorEpisodes'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import './ContentDetailPage.css'

const PH_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6']

/** 녹음 진행률 — 응답에 아직 없어 회차 상태 기준 mock 으로 생성(추후 실데이터로 교체). */
function mockProgress(ep: { id: number; status: string }): { recorded: number; total: number } {
  const total = 30 + (ep.id % 30)
  let recorded: number
  if (ep.status === 'draft' || ep.status === 'ready') recorded = 0
  else if (ep.status === 'recording') recorded = Math.floor((total * (ep.id % 9)) / 10)
  else recorded = total // reviewing/approved/scheduled/published/archived
  return { recorded, total }
}

/**
 * 내 콘텐츠 — 작품 상세 + 회차 목록. (vooth-tool 패턴)
 * 상단: GET /creators/contents/:id 작품 메타. 하단: GET .../episodes 회차 목록.
 * 회차를 고르면 녹음 화면(/works/:episodeId)으로 이동.
 */
export function ContentDetailPage(): React.JSX.Element {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const id = Number(contentId)

  // 작품 메타: 실 API(상세). 목록에서 넘긴 router state 를 로딩 중 즉시 표시용으로 사용.
  const passed = (location.state as { content?: CreatorContent } | null)?.content ?? null
  const { data: fetched } = useCreatorContent(id)
  const content = fetched ?? passed

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const {
    data: episodeData,
    isLoading,
    isError,
    error
  } = useCreatorEpisodes(id, debouncedSearch || undefined)
  // items 가 배열이 아닌 비정상 응답이어도 크래시하지 않도록 가드 + 최신 회차 먼저.
  const episodes = (Array.isArray(episodeData?.items) ? episodeData.items : [])
    .slice()
    .sort((a, b) => b.chapter - a.chapter)

  return (
    <div className="cd">
      <button className="cd__back" onClick={() => navigate('/works')}>
        ← 내 콘텐츠
      </button>

      <div className="cd__head">
        <div
          className="cd__thumb"
          style={
            content?.thumbnailUrl ? undefined : { background: PH_COLORS[id % PH_COLORS.length] }
          }
        >
          {content?.thumbnailUrl ? (
            <img src={content.thumbnailUrl} alt="" draggable={false} />
          ) : (
            <span>{(content?.title ?? '작').slice(0, 1)}</span>
          )}
        </div>
        <div className="cd__info">
          <h2 className="cd__title">{content?.title ?? `작품 #${id}`}</h2>
          <div className="cd__meta">
            {content?.status && (
              <span className="cd__status">
                {CONTENT_STATUS_LABEL[content.status] ?? content.status}
              </span>
            )}
            <span className="cd__count">회차 {content?.episodeCount ?? episodes.length}</span>
          </div>
          {!!content?.tags?.length && (
            <div className="cd__tags">
              {content.tags.map((t) => (
                <span
                  key={t.id}
                  className="cd__tag"
                  style={{ color: t.color, borderColor: t.color }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
          {content?.description && <p className="cd__desc">{content.description}</p>}
        </div>
      </div>

      <div className="cd__section">
        <div className="cd__section-head">
          <h3 className="cd__section-title">회차</h3>
          <span className="cd__section-count">총 {episodes.length}화</span>
          <input
            className="cd__search"
            type="text"
            placeholder="회차 제목 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="cd-table">
          <thead>
            <tr>
              <th>회차</th>
              <th>제목</th>
              <th>내 진행</th>
              <th>상태</th>
              <th aria-label="녹음" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="cd-table__state">
                  불러오는 중…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={5} className="cd-table__state cd-table__state--error">
                  회차를 불러오지 못했습니다. {error?.message}
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              episodes.map((ep) => {
                const { recorded, total } = mockProgress(ep)
                const pct = total ? Math.round((recorded / total) * 100) : 0
                const canRecord = ep.status === 'ready'
                return (
                  <tr key={ep.id} className="cd-table__row">
                    <td className="cd-table__chapter">{ep.chapter}화</td>
                    <td className="cd-table__title">{ep.title}</td>
                    <td>
                      <div className="cd-progress">
                        <div className="cd-progress__track">
                          <div className="cd-progress__bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="cd-progress__count">
                          {recorded}/{total}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`cd-status cd-status--${ep.status}`}>
                        {CONTENT_STATUS_LABEL[ep.status] ?? ep.status}
                      </span>
                    </td>
                    <td className="cd-table__action">
                      <button
                        type="button"
                        className="cd-rec-btn"
                        disabled={!canRecord}
                        title={canRecord ? undefined : '녹음 대기 상태에서만 녹음할 수 있습니다.'}
                        onClick={() =>
                          navigate(`/works/contents/${id}/episodes/${ep.id}`, {
                            state: {
                              episode: { chapter: ep.chapter, title: ep.title, status: ep.status },
                              contentTitle: content?.title
                            }
                          })
                        }
                      >
                        ● 녹음하기
                      </button>
                    </td>
                  </tr>
                )
              })}
            {!isLoading && !isError && episodes.length === 0 && (
              <tr>
                <td colSpan={5} className="cd-table__state">
                  등록된 회차가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
