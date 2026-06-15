import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {
  EPISODE_STATUS_META,
  fetchCreatorEpisode,
  type CreatorEpisodeDetail,
  type EpisodeListItem
} from '../api/episodes.api'
import { createRecording, fetchRecordings } from '../api/recordings.api'
import { uploadBlob } from '../lib/uploadBlob'
import { useMe } from '../features/me/useMe'
import { useRecorder } from '../features/recording/useRecorder'
import {
  RECORDING_STATUS_META,
  RecordingStatus,
  type Cut,
  type Line,
  type Recording,
  type RecordingEpisode as Episode
} from '../types/recording-domain'
import { deriveCutDuration } from '../lib/recording-timeline'
import { CropFrame } from '../components/CropFrame'
import { ScrollPreview } from '../features/preview/ScrollPreview'
import { formatMs } from '../lib/timeline'
import './RecordingPage.css'

/** 회차 상세(서버) → 녹음 도메인 Episode 매핑. */
function toEpisode(d: CreatorEpisodeDetail, contentTitle: string): Episode {
  return {
    id: d.id,
    contentId: d.contentId,
    contentTitle,
    title: d.title,
    chapter: d.chapter,
    status: d.status,
    cutCount: d.cutCount,
    lineCount: d.lineCount,
    cuts: d.cuts.map((c) => ({
      id: c.id,
      episodeId: c.episodeId,
      position: c.position,
      imageUrl: c.imageUrl,
      imageWidth: c.imageWidth ?? undefined,
      imageHeight: c.imageHeight ?? undefined,
      cropBox: c.cropBox ?? undefined,
      lines: c.lines.map((l) => ({
        id: l.id,
        cutId: l.cutId,
        episodeId: l.episodeId,
        characterId: l.characterId,
        position: l.position,
        script: l.script
      }))
    }))
  }
}

/** 라인에 take 를 추가하는 콜백(업로드+생성까지 끝난 뒤 호출). */
type CaptureFn = (line: Line, take: number, blob: Blob, blobUrl: string, durationMs: number) => Promise<void>

function PlayButton({ rec }: { rec: Recording }): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const canPlay = Boolean(rec.audioUrl)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback((): void => {
    if (!rec.audioUrl) return
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
  }, [rec.audioUrl])

  if (!canPlay) {
    return (
      <button type="button" className="rp-take__play rp-take__play--off" disabled>
        오디오 없음
      </button>
    )
  }
  return (
    <button type="button" className="rp-take__play" onClick={toggle}>
      {playing ? '■ 정지' : '▶ 재생'}
    </button>
  )
}

function TakeRow({ rec, mine }: { rec: Recording; mine: boolean }): React.JSX.Element {
  const meta = RECORDING_STATUS_META[rec.status]
  return (
    <li className={`rp-take${mine ? ' rp-take--mine' : ''}`}>
      <span className="rp-take__no">T{rec.take}</span>
      <span className="rp-take__name">{rec.creatorName}</span>
      <span className="rp-take__badge" style={{ color: meta.color, background: meta.background }}>
        {meta.label}
      </span>
      <span className="rp-take__dur">{formatMs(rec.durationMs)}</span>
      <PlayButton rec={rec} />
    </li>
  )
}

/** 라인별 녹음 컨트롤(녹음 → 정지 → 업로드+생성). */
function RecordControl({
  line,
  myTakeCount,
  onCapture
}: {
  line: Line
  myTakeCount: number
  onCapture: CaptureFn
}): React.JSX.Element {
  const { isRecording, error, start, stop } = useRecorder()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

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
    setSaveErr(null)
    try {
      await start()
    } catch {
      /* useRecorder.error 로 표시 */
    }
  }, [start])

  const handleStop = useCallback(async (): Promise<void> => {
    setBusy(true)
    setSaveErr(null)
    try {
      const { blob, url, durationMs } = await stop()
      await onCapture(line, myTakeCount + 1, blob, url, durationMs)
    } catch (e) {
      setSaveErr((e as Error)?.message ?? '저장에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }, [stop, line, myTakeCount, onCapture])

  return (
    <div className="rp-record">
      {isRecording ? (
        <>
          <span className="rp-record__live">● 녹음 중 ({formatMs(elapsedMs)})</span>
          <button type="button" className="rp-record__stop" onClick={handleStop} disabled={busy}>
            {busy ? '업로드 중…' : '정지'}
          </button>
        </>
      ) : (
        <button type="button" className="rp-record__start" onClick={handleStart} disabled={busy}>
          ● {busy ? '업로드 중…' : myTakeCount > 0 ? '다시 녹음' : '녹음'}
        </button>
      )}
      {error && <span className="rp-record__error">{error}</span>}
      {saveErr && <span className="rp-record__error">{saveErr}</span>}
    </div>
  )
}

function LineCard({
  line,
  characterName,
  recordings,
  creatorId,
  onCapture
}: {
  line: Line
  characterName: string
  recordings: Recording[]
  creatorId: number
  onCapture: CaptureFn
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
            <TakeRow key={rec.id} rec={rec} mine />
          ))}
          {otherTakes.map((rec) => (
            <TakeRow key={rec.id} rec={rec} mine={false} />
          ))}
        </ul>
      )}

      <RecordControl line={line} myTakeCount={myTakes.length} onCapture={onCapture} />
    </li>
  )
}

function CutSection({
  cut,
  index,
  charactersById,
  recordingsByLine,
  creatorId,
  onCapture
}: {
  cut: Cut
  index: number
  charactersById: Record<number, string>
  recordingsByLine: Record<number, Recording[]>
  creatorId: number
  onCapture: CaptureFn
}): React.JSX.Element {
  const lines = sortBy(cut.lines, 'position')
  const { ms, undecided } = deriveCutDuration(cut, recordingsByLine)

  return (
    <section className="rp-cut">
      <div className="rp-cut__image-wrap">
        <CropFrame src={cut.imageUrl} cropBox={cut.cropBox} alt={`컷 ${index}`} />
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
            onCapture={onCapture}
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
  const contentId = nav?.episode?.contentId
  const episodeId = nav?.episode?.id

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ['creator-episode', contentId, episodeId],
    queryFn: () => fetchCreatorEpisode(contentId as number, episodeId as number),
    enabled: Boolean(contentId && episodeId),
    retry: false
  })

  const episode = useMemo(
    () => (detail ? toEpisode(detail, nav?.contentTitle ?? '콘텐츠') : null),
    [detail, nav?.contentTitle]
  )

  // 라인에 묶인 character → id별 이름 맵.
  const charactersById = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const cut of detail?.cuts ?? []) {
      for (const line of cut.lines) {
        if (line.character) map[line.character.id] = line.character.name
      }
    }
    return map
  }, [detail])

  // 내 녹음 목록(서버) → lineId 별 그룹. 목록 API 는 본인 녹음만 반환한다.
  const queryClient = useQueryClient()
  const { data: recData } = useQuery({
    queryKey: ['creator-recordings', episodeId],
    queryFn: () => fetchRecordings(episodeId as number),
    enabled: Boolean(episodeId),
    retry: false
  })

  const recordingsByLine = useMemo<Record<number, Recording[]>>(() => {
    const recs = (recData?.items ?? []).map<Recording>((r) => ({
      id: r.id,
      lineId: r.lineId,
      episodeId: r.episodeId,
      creatorId: r.creatorId,
      creatorName,
      audioUrl: r.audioUrl,
      durationMs: r.durationMs,
      status: r.status as RecordingStatus,
      take: r.take
    }))
    return groupBy(recs, 'lineId')
  }, [recData, creatorName])

  // 녹음 정지 → 오디오 업로드 → 녹음 생성 → 목록 갱신(서버가 진실).
  const onCapture = useCallback<CaptureFn>(
    async (line, take, blob, _blobUrl, durationMs) => {
      const audioUrl = await uploadBlob(blob, `take-${line.id}-${take}.webm`)
      await createRecording({ lineId: line.id, episodeId: line.episodeId, audioUrl, durationMs, take })
      await queryClient.invalidateQueries({ queryKey: ['creator-recordings', episodeId] })
    },
    [queryClient, episodeId]
  )

  const [showPreview, setShowPreview] = useState(false)
  const backTo = nav?.episode ? `/webtoons/${nav.episode.contentId}` : '/webtoons'

  if (!contentId || !episodeId) {
    return (
      <div className="rp-empty">
        <p className="rp-empty__msg">회차 정보를 찾을 수 없습니다.</p>
        <Link className="rp-empty__back" to="/webtoons">
          콘텐츠 목록으로
        </Link>
      </div>
    )
  }

  if (isLoading || !episode) {
    return (
      <div className="rp-empty">
        <p className="rp-empty__msg">{isError ? `불러오지 못했습니다. ${(error as Error)?.message}` : '불러오는 중…'}</p>
        <Link className="rp-empty__back" to={backTo}>
          돌아가기
        </Link>
      </div>
    )
  }

  const statusMeta = EPISODE_STATUS_META[episode.status]
  const myRecordedLines = episode.cuts.reduce(
    (acc, cut) =>
      acc + cut.lines.filter((l) => (recordingsByLine[l.id] ?? []).some((r) => r.creatorId === creatorId)).length,
    0
  )
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
        ℹ️ 내 녹음은 저장되어 다시 들어와도 보입니다. (다른 성우의 take 는 본인 녹음만 조회되어 표시되지 않습니다)
      </p>

      <div className="rp__cuts">
        {sortBy(episode.cuts, 'position').map((cut, i) => (
            <CutSection
              key={cut.id}
              cut={cut}
              index={i + 1}
              charactersById={charactersById}
              recordingsByLine={recordingsByLine}
              creatorId={creatorId}
              onCapture={onCapture}
            />
          ))}
      </div>
    </div>
  )
}
