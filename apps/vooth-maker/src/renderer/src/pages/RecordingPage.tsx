import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import {
  EPISODE_STATUS_META,
  fetchCreatorEpisode,
  type CreatorEpisodeDetail,
  type EpisodeListItem
} from '../api/episodes.api'
import { createRecording, deleteRecording, fetchRecordings } from '../api/recordings.api'
import { clearLineTake, fetchLineTakes, selectLineTake } from '../api/lineTakes.api'
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
import { deriveCutDuration, representativeTake } from '../lib/recording-timeline'
import { CropFrame } from '../components/CropFrame'
import { ScrollPreview } from '../components/ScrollPreview'
import type { ScrollInputCut } from '../lib/scrollTimeline'
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

/** 녹음 정지 후 업로드+생성 콜백. take 는 서버가 부여. */
type CaptureFn = (line: Line, blob: Blob, durationMs: number) => Promise<void>

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

function TakeRow({
  rec,
  mine,
  selected,
  onToggleSelect,
  onRequestDelete
}: {
  rec: Recording
  mine: boolean
  selected: boolean
  onToggleSelect: () => void
  onRequestDelete: () => void
}): React.JSX.Element {
  const meta = RECORDING_STATUS_META[rec.status]
  return (
    <li className={`rp-take${mine ? ' rp-take--mine' : ''}${selected ? ' rp-take--selected' : ''}`}>
      <span className="rp-take__no">T{rec.take}</span>
      <span className="rp-take__name">{rec.creatorName}</span>
      <span className="rp-take__badge" style={{ color: meta.color, background: meta.background }}>
        {meta.label}
      </span>
      <span className="rp-take__dur">{formatMs(rec.durationMs)}</span>
      <PlayButton rec={rec} />
      {mine && (
        <>
          <button
            type="button"
            className={`rp-take__pick${selected ? ' rp-take__pick--on' : ''}`}
            onClick={onToggleSelect}
          >
            {selected ? '★ 최종' : '채택'}
          </button>
          <button
            type="button"
            className="rp-take__delete"
            onClick={onRequestDelete}
            title="이 take 삭제"
            aria-label={`T${rec.take} 삭제`}
          >
            🗑
          </button>
        </>
      )}
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
      const { blob, durationMs } = await stop()
      await onCapture(line, blob, durationMs)
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
  selectedRecordingId,
  onToggleSelect,
  onRequestDelete,
  onCapture
}: {
  line: Line
  characterName: string
  recordings: Recording[]
  selectedRecordingId?: number
  onToggleSelect: (lineId: number, recordingId: number) => void
  onRequestDelete: (rec: Recording) => void
  onCapture: CaptureFn
}): React.JSX.Element {
  // 목록 API 가 본인 녹음만 반환하므로 가져온 take 는 모두 내 것이다.
  const myTakes = sortBy(recordings, 'take')

  return (
    <li className="rp-line">
      <div className="rp-line__head">
        <span className="rp-line__character">{characterName}</span>
        <p className="rp-line__script">{line.script}</p>
      </div>

      {myTakes.length > 0 && (
        <ul className="rp-line__takes">
          {myTakes.map((rec) => (
            <TakeRow
              key={rec.id}
              rec={rec}
              mine
              selected={rec.id === selectedRecordingId}
              onToggleSelect={() => onToggleSelect(line.id, rec.id)}
              onRequestDelete={() => onRequestDelete(rec)}
            />
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
  selectedByLine,
  onToggleSelect,
  onRequestDelete,
  onCapture
}: {
  cut: Cut
  index: number
  charactersById: Record<number, string>
  recordingsByLine: Record<number, Recording[]>
  selectedByLine: Record<number, number>
  onToggleSelect: (lineId: number, recordingId: number) => void
  onRequestDelete: (rec: Recording) => void
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
            selectedRecordingId={selectedByLine[line.id]}
            onToggleSelect={onToggleSelect}
            onRequestDelete={onRequestDelete}
            onCapture={onCapture}
          />
        ))}
      </ul>
    </section>
  )
}

/** 녹음 삭제 확인 모달. 채택된 take 면 추가 경고를 보여준다. */
function ConfirmDeleteDialog({
  rec,
  isSelected,
  pending,
  error,
  onConfirm,
  onCancel
}: {
  rec: Recording
  isSelected: boolean
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}): React.JSX.Element {
  return (
    <div className="rp-modal" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="rp-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="rp-modal__title">녹음 삭제</h3>
        <p className="rp-modal__desc">
          <b>T{rec.take}</b> 녹음을 삭제할까요? 삭제하면 되돌릴 수 없습니다.
        </p>
        {isSelected && (
          <p className="rp-modal__warn">
            ⚠️ 이 take 는 현재 <b>최종 채택본</b>입니다. 삭제하면 이 대사의 채택이 해제되어 다시 채택해야 합니다.
          </p>
        )}
        {error && <p className="rp-modal__error">{error}</p>}
        <div className="rp-modal__actions">
          <button type="button" className="rp-modal__btn" onClick={onCancel} disabled={pending}>
            취소
          </button>
          <button
            type="button"
            className="rp-modal__btn rp-modal__btn--danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RecordingPage(): React.JSX.Element {
  const { state } = useLocation()
  const { data: me } = useMe()
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

  // 내 채택(LineTake): lineId → recordingId.
  const { data: takeData } = useQuery({
    queryKey: ['creator-line-takes', episodeId],
    queryFn: () => fetchLineTakes(episodeId as number),
    enabled: Boolean(episodeId),
    retry: false
  })
  const selectedByLine = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    for (const t of takeData?.items ?? []) map[t.lineId] = t.recordingId
    return map
  }, [takeData])

  const onToggleSelect = useCallback(
    (lineId: number, recordingId: number): void => {
      const isSelected = selectedByLine[lineId] === recordingId
      const run = isSelected ? clearLineTake(lineId) : selectLineTake(lineId, recordingId)
      void run.then(() => queryClient.invalidateQueries({ queryKey: ['creator-line-takes', episodeId] }))
    },
    [selectedByLine, queryClient, episodeId]
  )

  // 녹음 삭제: 확인 모달 → DELETE → 녹음/채택 목록 갱신(채택 take 삭제 시 채택도 풀리므로 둘 다 무효화).
  const [pendingDelete, setPendingDelete] = useState<Recording | null>(null)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecording(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['creator-recordings', episodeId] }),
        queryClient.invalidateQueries({ queryKey: ['creator-line-takes', episodeId] })
      ])
      setPendingDelete(null)
    }
  })
  const onRequestDelete = useCallback((rec: Recording): void => {
    setPendingDelete(rec)
    deleteMutation.reset()
  }, [deleteMutation])

  // 녹음 정지 → 오디오 업로드 → 녹음 생성 → 목록 갱신(서버가 진실).
  const onCapture = useCallback<CaptureFn>(
    async (line, blob, durationMs) => {
      const audioUrl = await uploadBlob(blob, `take-${line.id}-${Date.now()}.webm`)
      await createRecording({ lineId: line.id, episodeId: line.episodeId, audioUrl, durationMs })
      await queryClient.invalidateQueries({ queryKey: ['creator-recordings', episodeId] })
    },
    [queryClient, episodeId]
  )

  // 미리보기용 입력: detail(anchorY/gap/hold/이미지) + 라인 대표 take durationMs.
  const previewCuts = useMemo<ScrollInputCut[]>(() => {
    if (!detail) return []
    return sortBy(detail.cuts, 'position').map((c) => ({
      imageUrl: c.imageUrl,
      imageWidth: c.imageWidth,
      imageHeight: c.imageHeight,
      holdMs: c.holdMs,
      lines: sortBy(c.lines, 'position').map((l) => {
        const recs = recordingsByLine[l.id] ?? []
        const selId = selectedByLine[l.id]
        const sel = selId != null ? recs.find((r) => r.id === selId) : undefined
        return {
          id: l.id,
          script: l.script,
          characterName: charactersById[l.characterId] ?? `캐릭터 #${l.characterId}`,
          anchorY: l.anchorY,
          gapBeforeMs: l.gapBeforeMs,
          // 채택 take 길이 우선, 없으면 대표 take.
          durationMs: (sel ?? representativeTake(recs))?.durationMs
        }
      })
    }))
  }, [detail, charactersById, recordingsByLine, selectedByLine])

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
    (acc, cut) => acc + cut.lines.filter((l) => (recordingsByLine[l.id] ?? []).length > 0).length,
    0
  )
  const totalMs = episode.cuts.reduce((acc, cut) => acc + deriveCutDuration(cut, recordingsByLine).ms, 0)

  return (
    <div className="rp">
      <div className="rp__split">
        <div className="rp__main">
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
              컷 {episode.cutCount}개 · 대사 {episode.lineCount}개 · 내 녹음 {myRecordedLines}/{episode.lineCount} · 예상
              길이 {formatMs(totalMs)}
            </div>
          </header>

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
                selectedByLine={selectedByLine}
                onToggleSelect={onToggleSelect}
                onRequestDelete={onRequestDelete}
                onCapture={onCapture}
              />
            ))}
          </div>
        </div>

        {/* 오른쪽 sticky 연속 스크롤 미리보기 — 녹음하며 확인 */}
        <aside className="rp__side">
          <ScrollPreview cuts={previewCuts} />
        </aside>
      </div>

      {pendingDelete && (
        <ConfirmDeleteDialog
          rec={pendingDelete}
          isSelected={selectedByLine[pendingDelete.lineId] === pendingDelete.id}
          pending={deleteMutation.isPending}
          error={deleteMutation.isError ? (deleteMutation.error as Error)?.message ?? '삭제하지 못했습니다.' : null}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          onCancel={() => {
            if (!deleteMutation.isPending) setPendingDelete(null)
          }}
        />
      )}
    </div>
  )
}
