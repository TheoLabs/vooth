import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEpisodeById } from '../mocks/episodes.mock'
import {
  buildTimeline,
  formatMs,
  type CutTimeline,
  type LineTimeline
} from '../lib/timeline'
import { RECORDING_STATUS_META, type Cut, type Episode, type Line, type Recording } from '../types/domain'
import { useMe } from '../features/me/useMe'
import { useRecorder } from '../features/recording/useRecorder'
import { PreviewPlayer } from '../features/preview/PreviewPlayer'
import './EpisodeViewerPage.css'

/**
 * 세션 로컬 녹음 take 의 id 생성기.
 * mock id(rec-NNN)와 충돌하지 않도록 별도 prefix 를 쓴다.
 * (앱 재시작 간 영속화는 불필요 — 녹음/선택은 모두 세션 로컬 mock state.)
 */
let localRecordingSeq = 0
function nextRecordingId(): string {
  localRecordingSeq += 1
  return `local-rec-${localRecordingSeq}`
}

/** 회차 state 에서 특정 라인을 변환해 새 Episode 를 반환하는 헬퍼(불변 갱신). */
function mapLine(episode: Episode, lineId: string, fn: (line: Line) => Line): Episode {
  return {
    ...episode,
    cuts: episode.cuts.map((cut) => {
      if (!cut.lines.some((l) => l.id === lineId)) return cut
      return {
        ...cut,
        lines: cut.lines.map((line) => (line.id === lineId ? fn(line) : line))
      }
    })
  }
}

interface LineActions {
  onSelect: (lineId: string, recordingId: string) => void
  onClear: (lineId: string) => void
  onRecorded: (lineId: string, rec: Recording) => void
  onDelete: (lineId: string, recordingId: string) => void
}

/** 단일 녹음 take 의 재생 버튼. objectURL 정리는 부모(state)에서 처리. */
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
      <button type="button" className="ev-casting__play ev-casting__play--disabled" disabled title="샘플(오디오 없음)">
        샘플
      </button>
    )
  }

  return (
    <button type="button" className="ev-casting__play" onClick={toggle}>
      {playing ? '■ 정지' : '▶ 재생'}
    </button>
  )
}

function RecordingBadges({
  line,
  actions
}: {
  line: Line
  actions: LineActions
}): React.JSX.Element {
  if (line.recordings.length === 0) {
    return <span className="ev-line__empty">미녹음/대기</span>
  }

  return (
    <ul className="ev-line__castings">
      {line.recordings.map((rec) => {
        const meta = RECORDING_STATUS_META[rec.status]
        const isSelected = rec.id === line.selectedRecordingId
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
            <PlayButton rec={rec} />
            {isSelected ? (
              <>
                <span className="ev-casting__final">최종</span>
                <button
                  type="button"
                  className="ev-casting__select ev-casting__select--clear"
                  onClick={() => actions.onClear(line.id)}
                >
                  해제
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ev-casting__select"
                onClick={() => actions.onSelect(line.id, rec.id)}
              >
                최종 선택
              </button>
            )}
            <button
              type="button"
              className="ev-casting__delete"
              title="이 녹음 삭제"
              onClick={() => {
                if (window.confirm('이 녹음을 삭제할까요?')) actions.onDelete(line.id, rec.id)
              }}
            >
              삭제
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** 라인별 녹음 컨트롤(대기 → 녹음 / 녹음 중 → 정지 / 에러 인라인). */
function RecordControl({
  line,
  meName,
  onRecorded
}: {
  line: Line
  meName: string
  onRecorded: LineActions['onRecorded']
}): React.JSX.Element {
  const { isRecording, error, start, stop } = useRecorder()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [busy, setBusy] = useState(false)

  // 녹음 중 경과시간 표시(초 단위 갱신).
  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0)
      return
    }
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt)
    }, 250)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const handleStart = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      await start()
    } catch {
      // 에러는 useRecorder 의 error 로 표시됨
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
        voiceActorId: 'me',
        voiceActorName: meName,
        status: 'RECORDED',
        durationMs,
        audioUrl: url
      }
      onRecorded(line.id, rec)
    } finally {
      setBusy(false)
    }
  }, [stop, line.id, meName, onRecorded])

  return (
    <div className="ev-record">
      {isRecording ? (
        <>
          <span className="ev-record__live">● 녹음 중 ({formatMs(elapsedMs)})</span>
          <button type="button" className="ev-record__stop" onClick={handleStop} disabled={busy}>
            정지
          </button>
        </>
      ) : (
        <button type="button" className="ev-record__start" onClick={handleStart} disabled={busy}>
          ● 녹음
        </button>
      )}
      {error && <span className="ev-record__error">{error}</span>}
    </div>
  )
}

function LineRow({
  line,
  lineTl,
  meName,
  actions
}: {
  line: Line
  lineTl: LineTimeline
  meName: string
  actions: LineActions
}): React.JSX.Element {
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
      <RecordingBadges line={line} actions={actions} />
      <RecordControl line={line} meName={meName} onRecorded={actions.onRecorded} />
    </li>
  )
}

function CutView({
  cut,
  cutTl,
  meName,
  actions
}: {
  cut: Cut
  cutTl: CutTimeline
  meName: string
  actions: LineActions
}): React.JSX.Element {
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
          return <LineRow key={line.id} line={line} lineTl={lineTl} meName={meName} actions={actions} />
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
  const { data: me } = useMe()
  const meName = me?.name ?? '나'

  // 정적 mock 을 읽기만 하던 것을 state 기반으로 전환.
  // take 선택/녹음 편집은 이 state 를 갱신하고, 타임라인은 state 에서 재계산한다.
  // (세션 로컬 — 앱 재시작 간 영속화는 하지 않는다.)
  const [episode, setEpisode] = useState<Episode | undefined>(() =>
    id ? getEpisodeById(id) : undefined
  )

  useEffect(() => {
    setEpisode(id ? getEpisodeById(id) : undefined)
  }, [id])

  // 녹음으로 만든 objectURL 누수 방지: 언마운트 시 일괄 revoke.
  const createdUrlsRef = useRef<string[]>([])
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      createdUrlsRef.current = []
    }
  }, [])

  const onSelect = useCallback((lineId: string, recordingId: string): void => {
    setEpisode((prev) =>
      prev ? mapLine(prev, lineId, (line) => ({ ...line, selectedRecordingId: recordingId })) : prev
    )
  }, [])

  const onClear = useCallback((lineId: string): void => {
    setEpisode((prev) =>
      prev ? mapLine(prev, lineId, (line) => ({ ...line, selectedRecordingId: undefined })) : prev
    )
  }, [])

  const onRecorded = useCallback((lineId: string, rec: Recording): void => {
    if (rec.audioUrl) createdUrlsRef.current.push(rec.audioUrl)
    setEpisode((prev) =>
      prev
        ? mapLine(prev, lineId, (line) => ({
            ...line,
            recordings: [...line.recordings, rec],
            // 새 take 를 자동으로 최종 선택해 "미정"을 해소한다.
            selectedRecordingId: rec.id
          }))
        : prev
    )
  }, [])

  const onDelete = useCallback((lineId: string, recordingId: string): void => {
    setEpisode((prev) =>
      prev
        ? mapLine(prev, lineId, (line) => {
            const target = line.recordings.find((r) => r.id === recordingId)
            // 직접 녹음한 take(blob)면 objectURL 정리.
            if (target?.audioUrl && target.audioUrl.startsWith('blob:')) {
              URL.revokeObjectURL(target.audioUrl)
              createdUrlsRef.current = createdUrlsRef.current.filter((u) => u !== target.audioUrl)
            }
            return {
              ...line,
              recordings: line.recordings.filter((r) => r.id !== recordingId),
              // 삭제한 take 가 최종이었으면 선택 해제(미정으로). 자동 재선택은 하지 않는다.
              selectedRecordingId:
                line.selectedRecordingId === recordingId ? undefined : line.selectedRecordingId
            }
          })
        : prev
    )
  }, [])

  const actions = useMemo<LineActions>(
    () => ({ onSelect, onClear, onRecorded, onDelete }),
    [onSelect, onClear, onRecorded, onDelete]
  )

  // 미리보기 트랙에서 최종 take 선택(null = 해제) / 앞 간격(gap) 조절.
  const onSelectTake = useCallback(
    (lineId: string, recordingId: string | null): void => {
      if (recordingId === null) onClear(lineId)
      else onSelect(lineId, recordingId)
    },
    [onClear, onSelect]
  )

  const onChangeGap = useCallback((lineId: string, gapBeforeMs: number): void => {
    // 음수 gap 은 앞 대사와 겹치게 한다(동시 발화). 하한 -3000ms.
    setEpisode((prev) =>
      prev ? mapLine(prev, lineId, (line) => ({ ...line, gapBeforeMs: Math.max(-3000, gapBeforeMs) })) : prev
    )
  }, [])

  const [showPreview, setShowPreview] = useState(false)

  const timeline = useMemo(
    () => (episode ? buildTimeline(episode) : null),
    [episode]
  )

  if (!episode || !timeline) {
    return (
      <div className="ev-empty">
        <p className="ev-empty__msg">회차를 찾을 수 없습니다.</p>
        <Link className="ev-empty__back" to="/">
          작업 목록으로 돌아가기
        </Link>
      </div>
    )
  }

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
          <button
            type="button"
            className="ev-header__preview"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? '미리보기 닫기' : '▶ 미리보기'}
          </button>
        </div>
        <TimelineBar cuts={timeline.cuts} totalMs={timeline.totalMs} />
      </header>

      {showPreview && (
        <div className="ev-preview">
          <PreviewPlayer episode={episode} onSelectTake={onSelectTake} onChangeGap={onChangeGap} />
        </div>
      )}

      <p className="ev-mock-note">
        ⚠️ 표시된 회차는 임시(mock) 샘플입니다. 최종 take 선택·녹음은 세션 로컬로만 반영됩니다(저장 안 됨).
      </p>

      <div className="ev-cuts">
        {episode.cuts.map((cut) => {
          const cutTl = cutTlById.get(cut.id)
          if (!cutTl) return null
          return <CutView key={cut.id} cut={cut} cutTl={cutTl} meName={meName} actions={actions} />
        })}
      </div>
    </div>
  )
}
