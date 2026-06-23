import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { EPISODE_STATUS_LABEL, EpisodeStatus } from '../domain/types'
import { Badge } from '../components/Badge'
import { EPISODE_STATUS_BADGE } from '../domain/format'
import { useDirectorContent } from '../features/content/useDirectorContents'
import { useDirectorEpisodes } from '../features/episode/useDirectorEpisodes'
import { CONTENT_STATUS_LABEL, type DirectorContent } from '../api/content.api'
import './tool.css'
import './content.css'

/** 앵커 단계(녹음 전) 회차 상태. 그 외(녹음 이후)는 연출 단계로 본다. */
const ANCHOR_STATUSES = new Set<string>([EpisodeStatus.DRAFT, EpisodeStatus.READY])

type Tab = 'all' | 'anchor' | 'direct'

/**
 * 컨텐츠 — 2단계: 작품 상세 + 하단 회차 탭(앵커 / 연출).
 * 상단: GET /directors/contents/:id 작품 메타(썸네일 중앙).
 * 하단: 회차를 단계별로 탭 분기 — 앵커 탭(draft/ready)→앵커 화면, 연출 탭(녹음 이후)→연출 에디터.
 * (directors/episodes 에 contentId 필터가 아직 없어 클라에서 contentId 로 거른다.)
 */
export function AnchorContentDetailPage(): React.JSX.Element {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const id = Number(contentId)

  // 목록 카드에서 넘어오면 router state 로 즉시 표시 → 단건 조회로 보강.
  const passed = (location.state as { content?: DirectorContent } | null)?.content
  const { data: fetched } = useDirectorContent(id)
  const content = fetched ?? passed ?? null

  // 회차는 작품 하위 엔드포인트(/directors/contents/:id/episodes)에서 서버가 콘텐츠로 필터.
  const { data: episodeData, isLoading, isError, error } = useDirectorEpisodes(id, { limit: 200 })
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  // 회차 검색은 클라에서 거른다(items 가 배열이 아닌 비정상 응답이어도 크래시하지 않도록 가드).
  const items = Array.isArray(episodeData?.items) ? episodeData.items : []
  const q = search.trim().toLowerCase()
  const allEpisodes = items.filter((e) => {
    if (!q) return true
    return e.title.toLowerCase().includes(q) || String(e.chapter).includes(q)
  })
  const anchorEpisodes = allEpisodes.filter((e) => ANCHOR_STATUSES.has(e.status))
  const directEpisodes = allEpisodes.filter((e) => !ANCHOR_STATUSES.has(e.status))
  const rows = tab === 'anchor' ? anchorEpisodes : tab === 'direct' ? directEpisodes : allEpisodes

  // 회차 상태에 맞는 에디터로 이동(앵커 단계→앵커 화면, 그 외→연출 에디터).
  const routeFor = (status: string, episodeId: number): string =>
    ANCHOR_STATUSES.has(status) ? `/anchors/${episodeId}` : `/episodes/${episodeId}`

  return (
    <div className="tool-page">
      <div>
        <button className="ed-back" onClick={() => navigate('/anchors')}>
          ← 컨텐츠 목록
        </button>

        <div className="ct-detail-head">
          <h2 className="tool-page__title">{content?.title ?? `작품 #${id}`}</h2>
          {content && (
            <div className="ct-detail-meta">
              <span className="ct-chip">
                {CONTENT_STATUS_LABEL[content.status] ?? content.status}
              </span>
              <span style={{ fontSize: 12, color: 'var(--vt-text-muted)' }}>
                회차 {content.episodeCount}
              </span>
            </div>
          )}
          <div className="ct-detail-thumb">
            {content?.thumbnailUrl ? (
              <img src={content.thumbnailUrl} alt="" draggable={false} />
            ) : (
              <span className="ct-card__ph">▦</span>
            )}
          </div>
          <p className="tool-page__desc ct-detail__desc">
            {content?.description ?? '회차를 골라 단계별로 작업합니다.'}
          </p>
        </div>
      </div>

      <div className="tool-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ct-tabbar">
          <div className="ct-tabs">
            <button
              className={`ct-tab${tab === 'all' ? ' ct-tab--active' : ''}`}
              onClick={() => setTab('all')}
            >
              전체<span className="ct-tab__count">{allEpisodes.length}</span>
            </button>
            <button
              className={`ct-tab${tab === 'anchor' ? ' ct-tab--active' : ''}`}
              onClick={() => setTab('anchor')}
            >
              앵커<span className="ct-tab__count">{anchorEpisodes.length}</span>
            </button>
            <button
              className={`ct-tab${tab === 'direct' ? ' ct-tab--active' : ''}`}
              onClick={() => setTab('direct')}
            >
              연출<span className="ct-tab__count">{directEpisodes.length}</span>
            </button>
          </div>
          <input
            className="tool-input"
            placeholder="회차 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 180 }}
          />
        </div>

        <table className="tool-table">
          <thead>
            <tr>
              <th>회차</th>
              <th>제목</th>
              <th>컷</th>
              <th>대사</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--vt-text-dim)', padding: 40 }}
                >
                  불러오는 중…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--vt-danger)', padding: 40 }}
                >
                  회차를 불러오지 못했습니다. {error?.message}
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              rows.map((e) => {
                const badge = EPISODE_STATUS_BADGE[e.status]
                return (
                  <tr
                    key={e.id}
                    className="is-clickable"
                    onClick={() => navigate(routeFor(e.status, e.id))}
                  >
                    <td>{e.chapter}화</td>
                    <td style={{ fontWeight: 600 }}>{e.title}</td>
                    <td style={{ color: 'var(--vt-text-muted)' }}>{e.cutCount ?? '-'}</td>
                    <td style={{ color: 'var(--vt-text-muted)' }}>{e.lineCount ?? '-'}</td>
                    <td>
                      {badge ? (
                        <Badge label={EPISODE_STATUS_LABEL[e.status] ?? e.status} {...badge} />
                      ) : (
                        e.status
                      )}
                    </td>
                  </tr>
                )
              })}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--vt-text-dim)', padding: 40 }}
                >
                  {search.trim()
                    ? '검색 결과가 없습니다.'
                    : tab === 'anchor'
                      ? '앵커 대상 회차가 없습니다.'
                      : tab === 'direct'
                        ? '연출 대상 회차가 없습니다.'
                        : '등록된 회차가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
