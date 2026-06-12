import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { EPISODE_STATUS_META, type EpisodeListItem } from '../api/episodes.api'
import { useMe } from '../features/me/useMe'
import { useRecorder } from '../features/recording/useRecorder'
import { buildRecordingEpisode } from '../mocks/recording-domain.mock'
import {
  canTransitionRecording,
  RECORDING_STATUS_META,
  RecordingStatus,
  type Cut,
  type Line,
  type Recording
} from '../types/recording-domain'
import { deriveCutDuration } from '../lib/recording-timeline'
import { ScrollPreview } from '../features/preview/ScrollPreview'
import { formatMs } from '../lib/timeline'
import './RecordingPage.css'

/** 세션 로컬 녹음 take 의 numeric id 생성기(mock seed id 와 충돌 안 나게 큰 수에서 시작). */
let localRecSeq = 2_000_000_000
function nextRecordingId(): number {
  localRecSeq += 1
  return localRecSeq
}

/** 단일 take 의 재생 버튼(직접 녹음한 blob 만 재생 가능). */
function PlayButton({ rec }: { rec: Recording }): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const canPlay = Boolean(rec.audioUrl && rec.audioUrl.startsWith('blob:'))

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback((): void => {
    if (!canPlay || !rec.audioUrl) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlaying(false)
      return
    }
    const audio = new Audio(rec.audioUrl)
    audio.onended = (): void => {
      setPlaying(false)
      audioRef.current = null
    }
    audioRef.current = audio
    setPlaying(true)
    void audio.play().catch(() => {
      setPlaying(false)
      audioRef.current = null
    })
  }, [canPlay, rec.audioUrl])

  if (!canPlay) {
    return (
      <button type="button" className="rp-take__play rp-take__play--off" disabled title="샘플(오디오 없음)">
        샘플
      </button>
    )
  }
  return (
    <button type="button" className="rp-take__play" onClick={toggle}>
      {playing ? '■ 정지' : '▶ 재생'}
    </button>
  )
}

interface LineActions {
  addTake: (line: Line, rec: Recording) => void
  submitTake: (lineId: number, recId: number) => void
  deleteTake: (lineId: number, recId: number) => void
}

/** 라인별 녹음 컨트롤(대기 → 녹음 / 녹음 중 → 정지). */
function RecordControl({
  line,
  myTakeCount,
  creatorId,
  creatorName,
  episodeId,
  onRecorded
}: {
  line: Line
  myTakeCount: number
  creatorId: number
  creatorName: string
  episodeId: number
  onRecorded: LineActions['addTake']
}): React.JSX.Element {
  const { isRecording, error, start, stop } = useRecorder()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0)
      return
    }
    const startedAt = performance.now()
    const timer = window.setInterval(() => setElapsedMs(performance.now() - startedAt), 250)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const handleStart = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      await start()
    } catch {
      /* 에러는 useRecorder.error 로 표시 */
    } finally {
      setBusy(false)
    }
  }, [start])

  const handleStop = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      const { url, durationMs } = await stop()
      const rec: Recording = {
        id: nextRecordingId(),
        lineId: line.id,
        episodeId,
        creatorId,
        creatorName,
        audioUrl: url,
        durationMs,
        status: RecordingStatus.RECORDED,
        take: myTakeCount + 1
      }
      onRecorded(line, rec)
    } finally {
      setBusy(false)
    }
  }, [stop, line, episodeId, creatorId, creatorName, myTakeCount, onRecorded])

  return (
    <div className="rp-record">
      {isRecording ? (
        <>
          <span className="rp-record__live">● 녹음 중 ({formatMs(elapsedMs)})</span>
          <button type="button" className="rp-record__stop" onClick={handleStop} disabled={busy}>
            정지
          </button>
        </>
      ) : (
        <button type="button" className="rp-record__start" onClick={handleStart} disabled={busy}>
          ● {myTakeCount > 0 ? '다시 녹음' : '녹음'}
        </button>
      )}
      {error && <span className="rp-record__error">{error}</span>}
    </div>
  )
}

function TakeRow({
  rec,
  mine,
  onSubmit,
  onDelete
}: {
  rec: Recording
  mine: boolean
  onSubmit: () => void
  onDelete: () => void
}): React.JSX.Element {
  const meta = RECORDING_STATUS_META[rec.status]
  const canSubmit = canTransitionRecording(rec.status, RecordingStatus.REVIEW) && rec.status === RecordingStatus.RECORDED

  return (
    <li className={`rp-take${mine ? ' rp-take--mine' : ''}`}>
      <span className="rp-take__no">T{rec.take}</span>
      <span className="rp-take__name">{rec.creatorName}</span>
      <span className="rp-take__badge" style={{ color: meta.color, background: meta.background }}>
        {meta.label}
      </span>
      <span className="rp-take__dur">{formatMs(rec.durationMs)}</span>
      <PlayButton rec={rec} />
      {mine && (
        <>
          {canSubmit && (
            <button type="button" className="rp-take__submit" onClick={onSubmit}>
              검수 요청
            </button>
          )}
          <button
            type="button"
            className="rp-take__delete"
            title="이 녹음 삭제"
            onClick={() => {
              if (window.confirm('이 녹음을 삭제할까요?')) onDelete()
            }}
          >
            삭제
          </button>
        </>
      )}
    </li>
  )
}

function LineCard({
  line,
  characterName,
  recordings,
  creatorId,
  creatorName,
  actions
}: {
  line: Line
  characterName: string
  recordings: Recording[]
  creatorId: number
  creatorName: string
  actions: LineActions
}): React.JSX.Element {
  const myTakes = recordings.filter((r) => r.creatorId === creatorId).sort((a, b) => a.take - b.take)
  const otherTakes = recordings.filter((r) => r.creatorId !== creatorId)

  return (
    <li className="rp-line">
      <div className="rp-line__head">
        <span className="rp-line__character">{characterName}</span>
        <p className="rp-line__script">{line.script}</p>
      </div>

      {(myTakes.length > 0 || otherTakes.length > 0) && (
        <ul className="rp-line__takes">
          {myTakes.map((rec) => (
            <TakeRow
              key={rec.id}
              rec={rec}
              mine
              onSubmit={() => actions.submitTake(line.id, rec.id)}
              onDelete={() => actions.deleteTake(line.id, rec.id)}
            />
          ))}
          {otherTakes.map((rec) => (
            <TakeRow key={rec.id} rec={rec} mine={false} onSubmit={() => {}} onDelete={() => {}} />
          ))}
        </ul>
      )}

      <RecordControl
        line={line}
        myTakeCount={myTakes.length}
        creatorId={creatorId}
        creatorName={creatorName}
        episodeId={line.episodeId}
        onRecorded={actions.addTake}
      />
    </li>
  )
}

function CutSection({
  cut,
  index,
  charactersById,
  recordingsByLine,
  creatorId,
  creatorName,
  actions
}: {
  cut: Cut
  index: number
  charactersById: Record<number, string>
  recordingsByLine: Record<number, Recording[]>
  creatorId: number
  creatorName: string
  actions: LineActions
}): React.JSX.Element {
  const lines = [...cut.lines].sort((a, b) => a.position - b.position)
  const { ms, undecided } = deriveCutDuration(cut, recordingsByLine)

  return (
    <section className="rp-cut">
      <div className="rp-cut__image-wrap">
        <img className="rp-cut__image" src={cut.imageUrl} alt={`컷 ${index}`} />
        <span className="rp-cut__order">컷 {index}</span>
        <span className="rp-cut__dur" title="대사별 대표 take 의 길이 합으로 계산">
          {formatMs(ms)}
          {undecided > 0 && <em className="rp-cut__undecided"> · 미정 {undecided}</em>}
        </span>
      </div>
      <ul className="rp-cut__lines">
        {lines.map((line) => (
          <LineCard
            key={line.id}
            line={line}
            characterName={charactersById[line.characterId] ?? `캐릭터 #${line.characterId}`}
            recordings={recordingsByLine[line.id] ?? []}
            creatorId={creatorId}
            creatorName={creatorName}
            actions={actions}
          />
        ))}
      </ul>
    </section>
  )
}

export function RecordingPage(): React.JSX.Element {
  const { state } = useLocation()
  const { data: me } = useMe()
  const creatorId = me?.id ?? 0
  const creatorName = me?.name ?? '나'

  const nav = state as { episode?: EpisodeListItem; contentTitle?: string } | null

  // 회차 목록 항목 + 콘텐츠 제목으로 도메인 mock 생성(컷/대사 수는 실데이터 기준).
  const mock = useMemo(() => {
    if (!nav?.episode) return null
    return buildRecordingEpisode(nav.episode, nav.contentTitle ?? '콘텐츠')
  }, [nav])

  const [recordingsByLine, setRecordingsByLine] = useState<Record<number, Recording[]>>(
    () => mock?.initialRecordings ?? {}
  )
  useEffect(() => {
    setRecordingsByLine(mock?.initialRecordings ?? {})
  }, [mock])

  // 직접 녹음한 objectURL 누수 방지.
  const createdUrlsRef = useRef<string[]>([])
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      createdUrlsRef.current = []
    }
  }, [])

  const addTake = useCallback((line: Line, rec: Recording): void => {
    if (rec.audioUrl) createdUrlsRef.current.push(rec.audioUrl)
    setRecordingsByLine((prev) => ({ ...prev, [line.id]: [...(prev[line.id] ?? []), rec] }))
  }, [])

  const submitTake = useCallback((lineId: number, recId: number): void => {
    setRecordingsByLine((prev) => ({
      ...prev,
      [lineId]: (prev[lineId] ?? []).map((r) =>
        r.id === recId && canTransitionRecording(r.status, RecordingStatus.REVIEW)
          ? { ...r, status: RecordingStatus.REVIEW }
          : r
      )
    }))
  }, [])

  const deleteTake = useCallback((lineId: number, recId: number): void => {
    setRecordingsByLine((prev) => {
      const list = prev[lineId] ?? []
      const target = list.find((r) => r.id === recId)
      if (target?.audioUrl && target.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.audioUrl)
        createdUrlsRef.current = createdUrlsRef.current.filter((u) => u !== target.audioUrl)
      }
      return { ...prev, [lineId]: list.filter((r) => r.id !== recId) }
    })
  }, [])

  const actions = useMemo<LineActions>(
    () => ({ addTake, submitTake, deleteTake }),
    [addTake, submitTake, deleteTake]
  )

  const [showPreview, setShowPreview] = useState(false)

  const backTo = nav?.episode ? `/webtoons/${nav.episode.contentId}` : '/webtoons'

  if (!mock) {
    return (
      <div className="rp-empty">
        <p className="rp-empty__msg">회차 정보를 찾을 수 없습니다.</p>
        <Link className="rp-empty__back" to={backTo}>
          돌아가기
        </Link>
      </div>
    )
  }

  const { episode, charactersById } = mock
  const statusMeta = EPISODE_STATUS_META[episode.status]

  // 내가 1개 이상 녹음한 대사 수 / 전체 대사 수.
  const myRecordedLines = episode.cuts.reduce(
    (acc, cut) =>
      acc + cut.lines.filter((l) => (recordingsByLine[l.id] ?? []).some((r) => r.creatorId === creatorId)).length,
    0
  )

  // 회차 예상 길이 = 컷 길이(대표 take durationMs 합)들의 합.
  const totalMs = episode.cuts.reduce((acc, cut) => acc + deriveCutDuration(cut, recordingsByLine).ms, 0)

  return (
    <div className="rp">
      <header className="rp__header">
        <Link className="rp__back" to={backTo}>
          ← 회차 목록으로 돌아가기
        </Link>
        <span className="rp__content">{episode.contentTitle}</span>
        <h2 className="rp__title">
          <span className="rp__chapter">{episode.chapter}화</span>
          {episode.title}
          {statusMeta && (
            <span className="rp__status" style={{ color: statusMeta.color, background: `${statusMeta.color}1a` }}>
              {statusMeta.label}
            </span>
          )}
        </h2>
        <div className="rp__summary">
          컷 {episode.cutCount}개 · 대사 {episode.lineCount}개 · 내 녹음 {myRecordedLines}/{episode.lineCount} · 예상 길이{' '}
          {formatMs(totalMs)}
          <button type="button" className="rp__preview-btn" onClick={() => setShowPreview(true)}>
            ▶ 미리보기
          </button>
        </div>
      </header>

      {showPreview && (
        <ScrollPreview episode={episode} recordingsByLine={recordingsByLine} onClose={() => setShowPreview(false)} />
      )}

      <p className="rp__mock-note">
        ⚠️ 컷/대사는 임시(mock) 샘플입니다. 녹음은 세션 로컬로만 반영됩니다(서버 업로드 전).
      </p>

      <div className="rp__cuts">
        {[...episode.cuts]
          .sort((a, b) => a.position - b.position)
          .map((cut, i) => (
            <CutSection
              key={cut.id}
              cut={cut}
              index={i + 1}
              charactersById={charactersById}
              recordingsByLine={recordingsByLine}
              creatorId={creatorId}
              creatorName={creatorName}
              actions={actions}
            />
          ))}
      </div>
    </div>
  )
}
