import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CONTENT_STATUS_META, TAG_COLOR_HEX, type ContentListItem } from '../api/contents.api'
import { EPISODE_STATUS_META, type EpisodeListItem } from '../api/episodes.api'
import { useContentDetail, useEpisodes } from '../features/contents/useContentDetail'
import './ContentDetailPage.css'

/** 참여 성우(mock — 캐스팅 집계 API 전까지). */
const MOCK_VOICE_ACTORS = ['김하늘', '박서준', '이도윤', '최유나']

function placeholder(title: string): string {
  const initial = title.trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#e2e8f0"/><text x="240" y="170" font-family="sans-serif" font-size="120" font-weight="800" fill="#94a3b8" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function Chip({ color, children }: { color: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="cd-chip" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}>
      {children}
    </span>
  )
}

/**
 * 녹음 진행률(mock). 녹음 도메인 API 전까지 id 로 안정적인 더미 완료 수를 만든다.
 * 분모(총 대사 lineCount)는 실데이터, 분자(녹음 완료)만 mock.
 */
function mockRecordedCount(episode: EpisodeListItem): number {
  if (episode.lineCount <= 0) return 0
  // id 기반 결정적 비율(0~1) → 회차마다 다르되 리렌더 시 고정.
  const ratio = ((episode.id * 2654435761) % 1000) / 1000
  return Math.round(episode.lineCount * ratio)
}

function EpisodeRow({
  episode,
  contentTitle
}: {
  episode: EpisodeListItem
  contentTitle: string
}): React.JSX.Element {
  const navigate = useNavigate()
  const statusMeta = EPISODE_STATUS_META[episode.status]
  const recorded = mockRecordedCount(episode)
  const percent = episode.lineCount > 0 ? Math.round((recorded / episode.lineCount) * 100) : 0

  return (
    <button
      type="button"
      className="cd-ep"
      onClick={() => navigate(`/recording/${episode.id}`, { state: { episode, contentTitle } })}
    >
      <div className="cd-ep__main">
        <div className="cd-ep__head">
          <span className="cd-ep__no">{episode.chapter}화</span>
          {statusMeta && (
            <span className="cd-ep__status" style={{ color: statusMeta.color, backgroundColor: `${statusMeta.color}1a` }}>
              {statusMeta.label}
            </span>
          )}
        </div>
        <p className="cd-ep__title">{episode.title}</p>
        <div className="cd-ep__bar" title="녹음 진행률 (mock)">
          <div className="cd-ep__bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="cd-ep__meta">
          컷 {episode.cutCount}개 · 녹음 {recorded}/{episode.lineCount} 대사 · {percent}%
        </span>
      </div>
      <span className="cd-ep__arrow">›</span>
    </button>
  )
}

export function ContentDetailPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useLocation()

  const { data: detail, isError: contentError } = useContentDetail(id)
  const { data: episodeData, isLoading: episodesLoading, isError: episodesError } = useEpisodes(id)

  // 로딩 동안에는 목록에서 넘어온 콘텐츠로 헤더를 먼저 채운다(없으면 상세 응답 대기).
  const fallback = (state as { content?: ContentListItem } | null)?.content
  const content = detail ?? fallback

  const episodes = episodeData?.items ?? []
  const title = content?.title ?? `콘텐츠 #${id}`
  const thumb = content?.thumbnailImageUrl || placeholder(title)
  const statusMeta = content ? CONTENT_STATUS_META[content.status] : undefined

  return (
    <div className="cd">
      <button type="button" className="cd__back" onClick={() => navigate('/webtoons')}>
        ← 콘텐츠 목록
      </button>

      {contentError && !content ? (
        <p className="cd__empty">콘텐츠를 불러오지 못했습니다.</p>
      ) : (
        <div className="cd__header">
          <img
            className="cd__thumb"
            src={thumb}
            alt={title}
            onError={(e) => {
              e.currentTarget.src = placeholder(title)
            }}
          />
          <div className="cd__info">
            <div className="cd__chips">
              {statusMeta && (
                <span className="cd-status" style={{ backgroundColor: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              )}
              {content?.tags?.map((tag) => (
                <Chip key={tag.id} color={TAG_COLOR_HEX[tag.color] ?? '#8c8c8c'}>
                  {tag.name}
                </Chip>
              ))}
            </div>
            <h2 className="cd__title">{title}</h2>
            {content?.description && <p className="cd__desc">{content.description}</p>}
            <div className="cd__cast">
              <span className="cd__cast-label">참여 성우 (임시)</span>
              <div className="cd__cast-list">
                {MOCK_VOICE_ACTORS.map((name) => (
                  <span key={name} className="cd-actor">
                    🎙 {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="cd__section-title">
        회차{episodeData ? ` ${episodeData.total}개` : ''}
      </h3>

      {episodesLoading && <p className="cd__empty">불러오는 중…</p>}
      {episodesError && <p className="cd__empty">회차를 불러오지 못했습니다.</p>}
      {!episodesLoading && !episodesError && episodes.length === 0 && (
        <p className="cd__empty">등록된 회차가 없습니다.</p>
      )}

      {episodes.length > 0 && (
        <div className="cd__episodes">
          {episodes.map((episode) => (
            <EpisodeRow key={episode.id} episode={episode} contentTitle={title} />
          ))}
        </div>
      )}
    </div>
  )
}
