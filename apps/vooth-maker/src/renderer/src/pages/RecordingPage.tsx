import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  EPISODE_STATUS_LABEL,
  EPISODE_STATUS_VARIANT,
  RECORDING_STATUS_LABEL,
  RECORDING_STATUS_VARIANT,
  getAssignedEpisode,
  MOCK_SCRIPTS,
  type MockCharacter,
  type MockLine,
  type RecordingStatus,
  type RecordingTake,
} from '../features/episodes/recording.mock'
import './RecordingPage.css'

// 로컬 EpisodeStatus 중 녹음(재녹음 포함) 가능한 상태. (shared EPISODE_RECORDABLE_STATUSES 와 동일 의미)
const RECORDABLE = new Set(['READY', 'RECORDING', 'REVIEWING'])

/** ms → 'M:SS.d' */
function fmtDuration(ms: number): string {
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}:${s.toString().padStart(2, '0')}.${d}`
}

/** 결정적 mock 파형 막대 높이(0..1) */
function fakeWaveform(seed: number, bars = 28): number[] {
  const out: number[] = []
  let x = seed * 9301 + 49297
  for (let i = 0; i < bars; i++) {
    x = (x * 9301 + 49297) % 233280
    out.push(0.25 + (x / 233280) * 0.75)
  }
  return out
}

function Waveform({ seed, active }: { seed: number; active?: boolean }): React.JSX.Element {
  const bars = useMemo(() => fakeWaveform(seed), [seed])
  return (
    <div className={`waveform${active ? ' waveform--active' : ''}`}>
      {bars.map((h, i) => (
        <span key={i} className="waveform__bar" style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </div>
  )
}

interface LineState {
  takes: RecordingTake[]
}

/** 라인의 대표 상태: 채택 take > 최신 take > 미녹음 */
function linePrimaryStatus(line: LineState): RecordingStatus | 'NONE' {
  if (line.takes.length === 0) return 'NONE'
  const selected = line.takes.find((t) => t.selected)
  return (selected ?? line.takes[line.takes.length - 1]).status
}

/** 라우트 래퍼: episodeId 별로 내부 상태(녹음 take 등)를 새로 초기화하도록 key 분리. */
export function RecordingPage(): React.JSX.Element {
  const { episodeId } = useParams<{ episodeId: string }>()
  return <RecordingScreen key={episodeId} />
}

/** 회차 녹음 화면 — 핵심. 컷/대사 + 라인별 녹음 컨트롤 + 하단 레코더 바. */
function RecordingScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { episodeId } = useParams<{ episodeId: string }>()
  const id = Number(episodeId)
  const meta = getAssignedEpisode(id)
  const script = MOCK_SCRIPTS[id]

  // 라인 take 들은 로컬 상태로 관리(녹음 인터랙션 mock).
  const initialLineStates = useMemo(() => {
    const m: Record<number, LineState> = {}
    script?.cuts.forEach((c) => c.lines.forEach((l) => (m[l.id] = { takes: l.takes })))
    return m
  }, [script])

  const [lineStates, setLineStates] = useState<Record<number, LineState>>(initialLineStates)
  const [activeLineId, setActiveLineId] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 녹음 타이머(mock): 100ms 틱으로 경과시간 증가.
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsedMs((v) => v + 100), 100)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  if (!meta || !script) {
    return (
      <div className="rec rec--missing">
        <p>회차를 찾을 수 없습니다.</p>
        <button type="button" className="rec-btn" onClick={() => navigate('/works')}>
          작업 목록으로
        </button>
      </div>
    )
  }

  const charById = new Map<number, MockCharacter>(script.characters.map((c) => [c.id, c]))
  const myCharIds = new Set(
    script.characters.filter((c) => c.name === meta.role).map((c) => c.id),
  )

  const allLines = script.cuts.flatMap((c) => c.lines)
  const myLines = allLines.filter((l) => myCharIds.has(l.characterId))
  const recordedCount = myLines.filter((l) => (lineStates[l.id]?.takes.length ?? 0) > 0).length
  const totalCount = myLines.length
  const pct = totalCount ? Math.round((recordedCount / totalCount) * 100) : 0
  const allRecorded = totalCount > 0 && recordedCount === totalCount

  const recordable = RECORDABLE.has(meta.status)
  const isReviewing = meta.status === 'REVIEWING'

  const activeLine = activeLineId != null ? allLines.find((l) => l.id === activeLineId) : null
  const activeChar = activeLine ? charById.get(activeLine.characterId) : null

  function startRecording(lineId: number): void {
    setActiveLineId(lineId)
    setElapsedMs(0)
    setIsRecording(true)
    setPlayingTakeId(null)
  }

  function stopAndSave(): void {
    if (activeLineId == null) return
    const duration = Math.max(elapsedMs, 500)
    const newTake: RecordingTake = {
      id: Date.now(),
      status: 'RECORDED',
      durationMs: duration,
      recordedAt: new Date().toISOString(),
      selected: true, // 새 take 를 채택 take 로
    }
    setLineStates((prev) => {
      const cur = prev[activeLineId]?.takes ?? []
      // 기존 채택 해제 후 새 take 채택
      const cleared = cur.map((t) => ({ ...t, selected: false }))
      return { ...prev, [activeLineId]: { takes: [...cleared, newTake] } }
    })
    setIsRecording(false)
    setElapsedMs(0)
  }

  function cancelRecording(): void {
    setIsRecording(false)
    setElapsedMs(0)
  }

  function togglePlay(takeId: number): void {
    setPlayingTakeId((cur) => (cur === takeId ? null : takeId))
  }

  return (
    <div className="rec">
      {/* ---- header ---- */}
      <header className="rec-header">
        <button type="button" className="rec-back" onClick={() => navigate('/works')}>
          ← 작업 목록
        </button>

        <div className="rec-header__main">
          <div className="rec-header__titles">
            <span className="rec-header__work">{meta.workTitle}</span>
            <h2 className="rec-header__title">
              {meta.episodeNo}화 · {meta.title}
            </h2>
            <span className="rec-header__role">🎭 {meta.role}</span>
          </div>

          <div className="rec-header__right">
            <span className={`status-pill status-pill--${EPISODE_STATUS_VARIANT[meta.status]}`}>
              {EPISODE_STATUS_LABEL[meta.status]}
            </span>
            <span className="rec-header__mock">MOCK</span>
          </div>
        </div>

        <div className="rec-header__progress">
          <div className="rec-progress">
            <div className="rec-progress__bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="rec-header__count">
            {recordedCount}/{totalCount} 라인 녹음 ({pct}%)
          </span>
          {isReviewing ? (
            <span className="rec-review-state">검수 요청됨 · 검수 대기 중</span>
          ) : (
            <button
              type="button"
              className="rec-btn rec-btn--primary"
              disabled={!recordable || !allRecorded}
              title={
                !recordable
                  ? '현재 상태에서는 검수 요청을 할 수 없습니다.'
                  : !allRecorded
                    ? '모든 라인 녹음을 완료해야 검수 요청이 가능합니다.'
                    : undefined
              }
            >
              검수 요청
            </button>
          )}
        </div>

        {meta.rejectionNote && (
          <p className="rec-reject">
            <strong>검수 반려</strong> {meta.rejectionNote}
          </p>
        )}
      </header>

      {/* ---- cut/line body ---- */}
      <div className="rec-body">
        {script.cuts.map((cut) => (
          <section key={cut.id} className="rec-cut">
            <div className="rec-cut__img" style={{ background: cut.placeholderColor }}>
              <span className="rec-cut__no">컷 {cut.position}</span>
            </div>

            <ul className="rec-cut__lines">
              {cut.lines.map((line) => {
                const char = charById.get(line.characterId)
                const mine = myCharIds.has(line.characterId)
                const state = lineStates[line.id] ?? { takes: [] }
                const primary = linePrimaryStatus(state)
                return (
                  <li
                    key={line.id}
                    className={`rec-line${activeLineId === line.id ? ' rec-line--active' : ''}${
                      mine ? '' : ' rec-line--other'
                    }`}
                  >
                    <div className="rec-line__head">
                      <span
                        className="rec-line__speaker"
                        style={{ color: char?.color ?? '#64748b' }}
                      >
                        <span
                          className="rec-line__dot"
                          style={{ background: char?.color ?? '#64748b' }}
                        />
                        {char?.name ?? '?'}
                      </span>
                      {!mine && <span className="rec-line__not-mine">상대역</span>}
                      {primary !== 'NONE' && (
                        <span className={`take-badge take-badge--${RECORDING_STATUS_VARIANT[primary]}`}>
                          {RECORDING_STATUS_LABEL[primary]}
                        </span>
                      )}
                    </div>

                    <p className="rec-line__text">{line.text}</p>

                    {mine && (
                      <LineControls
                        line={line}
                        takes={state.takes}
                        recordable={recordable}
                        isActiveRecording={isRecording && activeLineId === line.id}
                        playingTakeId={playingTakeId}
                        onRecord={() => startRecording(line.id)}
                        onPlay={togglePlay}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* ---- bottom recorder bar ---- */}
      {activeLine && activeChar && (
        <div className="rec-bar">
          <div className="rec-bar__info">
            <span className="rec-bar__speaker" style={{ color: activeChar.color }}>
              {activeChar.name}
            </span>
            <span className="rec-bar__text">{activeLine.text}</span>
          </div>

          <div className="rec-bar__center">
            <Waveform seed={activeLine.id} active={isRecording} />
            <span className="rec-bar__timer">{fmtDuration(elapsedMs)}</span>
          </div>

          <div className="rec-bar__actions">
            {isRecording ? (
              <>
                <button type="button" className="rec-btn rec-btn--stop" onClick={stopAndSave}>
                  ■ 정지 · 저장
                </button>
                <button type="button" className="rec-btn rec-btn--ghost" onClick={cancelRecording}>
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rec-btn rec-btn--record"
                  disabled={!recordable}
                  onClick={() => startRecording(activeLine.id)}
                >
                  ● 다시 녹음
                </button>
                <button
                  type="button"
                  className="rec-btn rec-btn--ghost"
                  onClick={() => setActiveLineId(null)}
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** 라인별 녹음 컨트롤(내 배역 라인에만 노출). take 목록 + 녹음/재생/다시 녹음. */
function LineControls({
  line,
  takes,
  recordable,
  isActiveRecording,
  playingTakeId,
  onRecord,
  onPlay,
}: {
  line: MockLine
  takes: RecordingTake[]
  recordable: boolean
  isActiveRecording: boolean
  playingTakeId: number | null
  onRecord: () => void
  onPlay: (takeId: number) => void
}): React.JSX.Element {
  const hasTakes = takes.length > 0
  return (
    <div className="line-ctrl">
      {hasTakes ? (
        <ul className="line-takes">
          {takes.map((t, i) => (
            <li key={t.id} className={`line-take${t.selected ? ' line-take--selected' : ''}`}>
              <button
                type="button"
                className={`take-play${playingTakeId === t.id ? ' take-play--on' : ''}`}
                onClick={() => onPlay(t.id)}
                aria-label="재생"
              >
                {playingTakeId === t.id ? '❚❚' : '▶'}
              </button>
              <span className="take-no">테이크 {i + 1}</span>
              <Waveform seed={t.id} active={playingTakeId === t.id} />
              <span className="take-time">{fmtDuration(t.durationMs)}</span>
              <span className={`take-badge take-badge--${RECORDING_STATUS_VARIANT[t.status]}`}>
                {RECORDING_STATUS_LABEL[t.status]}
              </span>
              {t.selected && <span className="take-selected">채택</span>}
            </li>
          ))}
        </ul>
      ) : (
        <span className="line-pending">아직 녹음하지 않은 대사입니다.</span>
      )}

      <button
        type="button"
        className={`rec-btn rec-btn--record-sm${isActiveRecording ? ' rec-btn--recording' : ''}`}
        disabled={!recordable}
        onClick={onRecord}
      >
        {isActiveRecording ? '● 녹음 중…' : hasTakes ? '다시 녹음' : '● 녹음'}
      </button>
      <span className="line-id">#{line.position}</span>
    </div>
  )
}
