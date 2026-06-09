import { useNavigate } from 'react-router-dom'
import { MOCK_EPISODES } from '../mocks/episodes.mock'
import { buildTimeline, formatMs } from '../lib/timeline'
import type { Episode } from '../types/domain'
import './WorkListPage.css'

/**
 * 회차 진행도 요약.
 * "완료 라인" = 해당 대사(Line)에 status === 'DONE' 인 녹음(Recording)이 1개 이상 있는 라인.
 * (멀티캐스팅이므로 한 라인에 여러 녹음이 있어도, 완료 녹음이 하나라도 있으면 완료로 본다.)
 */
interface EpisodeProgress {
  totalLines: number
  doneLines: number
  percent: number
  /** 화면 상태 요약용 라벨 */
  statusLabel: string
  statusKey: 'pending' | 'in_progress' | 'done'
}

function getEpisodeProgress(episode: Episode): EpisodeProgress {
  const lines = episode.cuts.flatMap((cut) => cut.lines)
  const totalLines = lines.length
  const doneLines = lines.filter((line) =>
    line.recordings.some((r) => r.status === 'DONE')
  ).length
  const percent = totalLines > 0 ? Math.round((doneLines / totalLines) * 100) : 0

  let statusKey: EpisodeProgress['statusKey'] = 'in_progress'
  let statusLabel = '녹음 중'
  if (doneLines === 0) {
    statusKey = 'pending'
    statusLabel = '대기'
  } else if (doneLines === totalLines && totalLines > 0) {
    statusKey = 'done'
    statusLabel = '완료'
  }

  return { totalLines, doneLines, percent, statusLabel, statusKey }
}

function EpisodeCard({ episode }: { episode: Episode }): React.JSX.Element {
  const navigate = useNavigate()
  const progress = getEpisodeProgress(episode)
  const totalMs = buildTimeline(episode).totalMs

  const handleOpen = (): void => {
    navigate(`/episodes/${episode.id}`)
  }

  return (
    <button type="button" className="work-card" onClick={handleOpen}>
      <div className="work-card__head">
        <span className="work-card__webtoon">{episode.webtoonTitle}</span>
        <span className={`work-card__status work-card__status--${progress.statusKey}`}>
          {progress.statusLabel}
        </span>
      </div>

      <p className="work-card__title">
        <span className="work-card__epno">{episode.episodeNo}화</span>
        {episode.title}
      </p>

      <div className="work-card__progress">
        <div className="work-card__progress-bar">
          <div className="work-card__progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="work-card__progress-text">
          완료 {progress.doneLines}/{progress.totalLines} 대사 · {progress.percent}%
        </span>
      </div>

      <div className="work-card__playtime">
        <span className="work-card__playtime-label">예상 재생 시간</span>
        <span className="work-card__playtime-value">{formatMs(totalMs)}</span>
      </div>
    </button>
  )
}

export function WorkListPage(): React.JSX.Element {
  return (
    <div className="work-list">
      <div className="work-list__intro">
        <h2 className="work-list__heading">내 작업</h2>
        <p className="work-list__subtitle">내가 녹음할 회차 목록이에요.</p>
      </div>

      <p className="work-list__mock-note">
        ⚠️ 표시된 데이터는 실제 데이터가 아닌 임시(mock) 샘플입니다.
      </p>

      <div className="work-list__grid">
        {MOCK_EPISODES.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>
    </div>
  )
}
