import { Link, useParams } from 'react-router-dom'
import { getEpisodeById } from '../mocks/episodes.mock'
import {
  buildTimeline,
  formatMs,
  type CutTimeline,
  type LineTimeline
} from '../lib/timeline'
import { RECORDING_STATUS_META, type Cut, type Line } from '../types/domain'
import './EpisodeViewerPage.css'

function RecordingBadges({
  line,
  lineTl
}: {
  line: Line
  lineTl: LineTimeline
}): React.JSX.Element {
  if (line.recordings.length === 0) {
    return <span className="ev-line__empty">미녹음/대기</span>
  }

  return (
    <ul className="ev-line__castings">
      {line.recordings.map((rec) => {
        const meta = RECORDING_STATUS_META[rec.status]
        const isSelected = lineTl.resolved && rec.id === lineTl.recordingId
        return (
          <li
            key={rec.id}
            className={`ev-casting${isSelected ? ' ev-casting--selected' : ''}`}
          >
            <span className="ev-casting__name">{rec.voiceActorName}</span>
            <span
              className="ev-casting__badge"
              style={{ color: meta.color, background: meta.background }}
            >
              {meta.label}
            </span>
            <span className="ev-casting__dur">{formatMs(rec.durationMs)}</span>
            {isSelected && <span className="ev-casting__final">최종</span>}
          </li>
        )
      })}
    </ul>
  )
}

function LineRow({ line, lineTl }: { line: Line; lineTl: LineTimeline }): React.JSX.Element {
  return (
    <li className="ev-line">
      <div className="ev-line__head">
        <div className="ev-line__text">
          {line.character && <span className="ev-line__character">{line.character}</span>}
          <span className="ev-line__body">{line.text}</span>
        </div>
        <span className="ev-line__range">
          {formatMs(lineTl.startMs)} – {formatMs(lineTl.endMs)}
          {!lineTl.resolved && <span className="ev-line__undecided">미정</span>}
        </span>
      </div>
      <RecordingBadges line={line} lineTl={lineTl} />
    </li>
  )
}

function CutView({ cut, cutTl }: { cut: Cut; cutTl: CutTimeline }): React.JSX.Element {
  const lineTlById = new Map(cutTl.lines.map((l) => [l.lineId, l]))
  return (
    <section className="ev-cut">
      <div className="ev-cut__image-wrap">
        <img className="ev-cut__image" src={cut.imageUrl} alt={`컷 ${cut.order}`} />
        <span className="ev-cut__order">컷 {cut.order}</span>
        <span className="ev-cut__range">
          {formatMs(cutTl.startMs)} – {formatMs(cutTl.endMs)} · {formatMs(cutTl.endMs - cutTl.startMs)}
        </span>
      </div>

      <ul className="ev-cut__lines">
        {cut.lines.map((line) => {
          const lineTl = lineTlById.get(line.id)
          if (!lineTl) return null
          return <LineRow key={line.id} line={line} lineTl={lineTl} />
        })}
      </ul>
    </section>
  )
}

function TimelineBar({
  cuts,
  totalMs
}: {
  cuts: CutTimeline[]
  totalMs: number
}): React.JSX.Element {
  return (
    <div className="ev-timeline" aria-label="회차 타임라인">
      <div className="ev-timeline__track">
        {cuts.map((cut, idx) => {
          const dur = cut.endMs - cut.startMs
          const width = totalMs > 0 ? (dur / totalMs) * 100 : 0
          return (
            <div
              key={cut.cutId}
              className={`ev-timeline__seg ev-timeline__seg--${idx % 2 === 0 ? 'a' : 'b'}`}
              style={{ width: `${width}%` }}
              title={`컷 ${idx + 1} · ${formatMs(dur)}`}
            >
              <span className="ev-timeline__seg-label">{idx + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EpisodeViewerPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const episode = id ? getEpisodeById(id) : undefined

  if (!episode) {
    return (
      <div className="ev-empty">
        <p className="ev-empty__msg">회차를 찾을 수 없습니다.</p>
        <Link className="ev-empty__back" to="/">
          작업 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const timeline = buildTimeline(episode)
  const cutTlById = new Map(timeline.cuts.map((c) => [c.cutId, c]))

  return (
    <div className="episode-viewer">
      <header className="ev-header">
        <Link className="ev-header__back" to="/">
          ← 작업 목록으로 돌아가기
        </Link>
        <div className="ev-header__titles">
          <span className="ev-header__webtoon">{episode.webtoonTitle}</span>
          <h2 className="ev-header__title">
            <span className="ev-header__epno">{episode.episodeNo}화</span>
            {episode.title}
          </h2>
        </div>
        <div className="ev-header__meta">
          <span className="ev-header__total-label">총 재생 시간</span>
          <span className="ev-header__total-value">{formatMs(timeline.totalMs)}</span>
        </div>
        <TimelineBar cuts={timeline.cuts} totalMs={timeline.totalMs} />
      </header>

      <p className="ev-mock-note">
        ⚠️ 표시된 데이터는 실제 데이터가 아닌 임시(mock) 샘플입니다. (읽기 전용)
      </p>

      <div className="ev-cuts">
        {episode.cuts.map((cut) => {
          const cutTl = cutTlById.get(cut.id)
          if (!cutTl) return null
          return <CutView key={cut.id} cut={cut} cutTl={cutTl} />
        })}
      </div>
    </div>
  )
}
