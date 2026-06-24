import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CONTENT_STATUS_LABEL, type CreatorContent } from '../api/content.api'
import { useCreatorContent } from '../features/content/useCreatorContents'
import './ContentDetailPage.css'

const PH_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#14b8a6']

type EpStatus = 'READY' | 'RECORDING' | 'REVIEWING' | 'PUBLISHED'
const EP_STATUS_LABEL: Record<EpStatus, string> = {
  READY: '녹음 대기',
  RECORDING: '녹음 중',
  REVIEWING: '검수 중',
  PUBLISHED: '발행 완료'
}
const EP_STATUSES: EpStatus[] = ['READY', 'RECORDING', 'REVIEWING', 'PUBLISHED']

interface MockEpisode {
  id: number
  chapter: number
  title: string
  status: EpStatus
  totalCuts: number
  recordedCuts: number
}

const EP_TITLES = [
  '첫 만남',
  '엇갈린 약속',
  '비밀의 화원',
  '두 번째 삶',
  '황궁의 밤',
  '폭풍 전야',
  '재회',
  '균열',
  '마지막 선택',
  '새벽의 결심'
]

/** content 의 회차 목록(mock). creators 회차 엔드포인트 생기면 교체. */
function mockEpisodes(contentId: number, count: number): MockEpisode[] {
  return Array.from({ length: count }, (_, i) => {
    const chapter = count - i // 최신 회차 먼저
    const status = EP_STATUSES[(contentId + i) % EP_STATUSES.length]
    const totalCuts = 30 + ((contentId * 7 + i * 13) % 30)
    const recordedCuts =
      status === 'READY'
        ? 0
        : status === 'PUBLISHED' || status === 'REVIEWING'
          ? totalCuts
          : Math.floor((totalCuts * ((contentId + i) % 10)) / 10)
    return {
      id: contentId * 1000 + chapter,
      chapter,
      title: EP_TITLES[(contentId + chapter) % EP_TITLES.length],
      status,
      totalCuts,
      recordedCuts
    }
  })
}

/**
 * 내 콘텐츠 — 작품 상세 + 회차 목록. (vooth-tool 패턴)
 * 상단: 작품 메타(목록 카드에서 router state 로 전달). 하단: 회차 목록(mock).
 * 회차를 고르면 녹음 화면(/works/:episodeId)으로 이동.
 */
export function ContentDetailPage(): React.JSX.Element {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const id = Number(contentId)

  // 작품 메타는 실 API(상세 조회). 목록에서 넘긴 router state 를 로딩 중 즉시 표시용으로 사용.
  const passed = (location.state as { content?: CreatorContent } | null)?.content ?? null
  const { data: fetched } = useCreatorContent(id)
  const content = fetched ?? passed
  const episodes = useMemo(() => mockEpisodes(id, content?.episodeCount ?? 8), [id, content])

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
          <span className="cd__mock-tag">MOCK</span>
          <span className="cd__section-count">총 {episodes.length}화</span>
        </div>

        <table className="cd-table">
          <thead>
            <tr>
              <th>회차</th>
              <th>제목</th>
              <th>내 진행</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => {
              const pct = ep.totalCuts ? Math.round((ep.recordedCuts / ep.totalCuts) * 100) : 0
              return (
                <tr
                  key={ep.id}
                  className="cd-table__row"
                  onClick={() => navigate(`/works/${ep.id}`)}
                >
                  <td className="cd-table__chapter">{ep.chapter}화</td>
                  <td className="cd-table__title">{ep.title}</td>
                  <td>
                    <div className="cd-progress">
                      <div className="cd-progress__track">
                        <div className="cd-progress__bar" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="cd-progress__count">
                        {ep.recordedCuts}/{ep.totalCuts}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`cd-status cd-status--${ep.status.toLowerCase()}`}>
                      {EP_STATUS_LABEL[ep.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
