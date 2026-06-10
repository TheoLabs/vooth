import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RECORDING_STATUS_META, type Cut, type Episode, type Line, type Recording } from '../../types/domain'
import { buildTimeline, formatMs } from '../../lib/timeline'
import { decodePeaks, synthPeaks } from './peaks'
import './PreviewPlayer.css'

interface PreviewPlayerProps {
  episode: Episode
  /** 트랙 클립에서 최종 take(성우) 선택. recordingId=null 이면 선택 해제. 제공 시 편집 패널 노출. */
  onSelectTake?: (lineId: string, recordingId: string | null) => void
  /** 트랙 클립에서 앞 간격(gapBeforeMs) 조절. 제공 시 편집 패널 노출. */
  onChangeGap?: (lineId: string, gapBeforeMs: number) => void
}

/**
 * 회차 미리보기 플레이어 (파이널컷 방식).
 *
 * buildTimeline 으로 만든 타임라인을 따라 **컷 이미지 + 대사 자막을 영상처럼 이어서 재생**한다.
 * 각 대사의 "최종 선택된 take" 오디오가 그 대사 구간에 재생된다.
 * (mock take 는 실제 오디오가 없어 무음으로 흐른다 — 실제 녹음한 blob take 만 소리가 난다.)
 */

interface FlatLine {
  lineId: string
  cutId: string
  startMs: number
  endMs: number
  line: Line
  cut: Cut
  recording?: Recording
}

/** 트랙 레인 1행 높이(px). */
const LANE_H = 52

function PlayIcon({ playing }: { playing: boolean }): React.JSX.Element {
  return <span className="pp-controls__icon">{playing ? '⏸' : '▶'}</span>
}

/** 대사 클립의 파형. blob 은 실제 디코딩, mock 은 합성 파형. */
function Waveform({ lineId, recording }: { lineId: string; recording?: Recording }): React.JSX.Element {
  const isBlob = Boolean(recording?.audioUrl && recording.audioUrl.startsWith('blob:'))
  const [peaks, setPeaks] = useState<number[]>(() => synthPeaks(lineId))

  useEffect(() => {
    let alive = true
    if (isBlob && recording?.audioUrl) {
      decodePeaks(recording.audioUrl)
        .then((p) => {
          if (alive) setPeaks(p)
        })
        .catch(() => {
          if (alive) setPeaks(synthPeaks(lineId))
        })
    } else {
      setPeaks(synthPeaks(lineId))
    }
    return () => {
      alive = false
    }
  }, [isBlob, recording?.audioUrl, lineId])

  return (
    <div className={`pp-wave${isBlob ? ' pp-wave--real' : ' pp-wave--synth'}`} aria-hidden="true">
      {peaks.map((v, i) => (
        <span key={i} className="pp-wave__bar" style={{ height: `${Math.max(8, Math.round(v * 100))}%` }} />
      ))}
    </div>
  )
}

export function PreviewPlayer({ episode, onSelectTake, onChangeGap }: PreviewPlayerProps): React.JSX.Element {
  const editable = Boolean(onSelectTake || onChangeGap)
  const timeline = useMemo(() => buildTimeline(episode), [episode])
  const totalMs = timeline.totalMs

  // lineId → {line, cut}, 그리고 타임라인 순서대로 평탄화한 라인 목록.
  const { flatLines, cutsTl } = useMemo(() => {
    const lineMap = new Map<string, { line: Line; cut: Cut }>()
    episode.cuts.forEach((cut) => cut.lines.forEach((line) => lineMap.set(line.id, { line, cut })))
    const flat: FlatLine[] = []
    timeline.cuts.forEach((cutTl) => {
      cutTl.lines.forEach((lt) => {
        const found = lineMap.get(lt.lineId)
        if (!found) return
        const recording = found.line.recordings.find((r) => r.id === lt.recordingId)
        flat.push({
          lineId: lt.lineId,
          cutId: cutTl.cutId,
          startMs: lt.startMs,
          endMs: lt.endMs,
          line: found.line,
          cut: found.cut,
          recording
        })
      })
    })
    return { flatLines: flat, cutsTl: timeline.cuts }
  }, [episode, timeline])

  const cutById = useMemo(() => new Map(episode.cuts.map((c) => [c.id, c])), [episode])

  // 겹치는 클립을 별도 레인(행)으로 쌓기 위한 그리디 레인 배정.
  const { laneOf, laneCount } = useMemo(() => {
    const sorted = [...flatLines].sort((a, b) => a.startMs - b.startMs)
    const laneEnds: number[] = []
    const map = new Map<string, number>()
    for (const fl of sorted) {
      let lane = laneEnds.findIndex((e) => e <= fl.startMs)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(fl.endMs)
      } else {
        laneEnds[lane] = fl.endMs
      }
      map.set(fl.lineId, lane)
    }
    return { laneOf: map, laneCount: Math.max(1, laneEnds.length) }
  }, [flatLines])

  const [playing, setPlaying] = useState(false)
  const [currentMs, setCurrentMs] = useState(0)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)
  const currentMsRef = useRef(0)
  // 겹침 동시 재생을 위해 라인별 오디오를 동시에 관리한다.
  const audiosRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  const cutAt = useCallback(
    (ms: number): string | undefined => {
      const seg =
        cutsTl.find((c) => ms >= c.startMs && ms < c.endMs) ??
        (ms >= totalMs ? cutsTl[cutsTl.length - 1] : cutsTl[0])
      return seg?.cutId
    },
    [cutsTl, totalMs]
  )

  const stopAllAudio = useCallback((): void => {
    audiosRef.current.forEach((a) => a.pause())
    audiosRef.current.clear()
  }, [])

  /** 현재 시각에 활성인 모든 대사 오디오를 동기화한다(겹치면 동시 재생). */
  const syncAudio = useCallback(
    (ms: number, isPlaying: boolean): void => {
      const active = new Set(flatLines.filter((l) => ms >= l.startMs && ms < l.endMs).map((l) => l.lineId))
      // 비활성/정지 상태 오디오 정리
      audiosRef.current.forEach((audio, lineId) => {
        if (!isPlaying || !active.has(lineId)) {
          audio.pause()
          audiosRef.current.delete(lineId)
        }
      })
      if (!isPlaying) return
      // 새로 활성화된 라인 재생(겹치면 여러 개 동시)
      flatLines.forEach((fl) => {
        if (!active.has(fl.lineId) || audiosRef.current.has(fl.lineId)) return
        const url = fl.recording?.audioUrl
        if (url && url.startsWith('blob:')) {
          const audio = new Audio(url)
          audio.currentTime = Math.max(0, (ms - fl.startMs) / 1000)
          audiosRef.current.set(fl.lineId, audio)
          void audio.play().catch(() => undefined)
        }
      })
    },
    [flatLines]
  )

  const tick = useCallback(
    (ts: number): void => {
      const dt = ts - lastTsRef.current
      lastTsRef.current = ts
      let next = currentMsRef.current + dt
      let reachedEnd = false
      if (next >= totalMs) {
        next = totalMs
        reachedEnd = true
      }
      currentMsRef.current = next
      setCurrentMs(next)
      syncAudio(next, true)
      if (reachedEnd) {
        setPlaying(false)
        stopAllAudio()
        rafRef.current = null
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [totalMs, syncAudio, stopAllAudio]
  )

  const play = useCallback((): void => {
    if (totalMs <= 0) return
    if (currentMsRef.current >= totalMs) {
      currentMsRef.current = 0
      setCurrentMs(0)
    }
    setPlaying(true)
    lastTsRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [totalMs, tick])

  const pause = useCallback((): void => {
    setPlaying(false)
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    stopAllAudio()
  }, [stopAllAudio])

  const toggle = useCallback((): void => {
    if (playing) pause()
    else play()
  }, [playing, play, pause])

  const seek = useCallback(
    (ms: number): void => {
      const clamped = Math.max(0, Math.min(ms, totalMs))
      currentMsRef.current = clamped
      setCurrentMs(clamped)
      stopAllAudio()
      if (playing) syncAudio(clamped, true)
    },
    [totalMs, playing, syncAudio, stopAllAudio]
  )

  // 언마운트 시 정리.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      audiosRef.current.forEach((a) => a.pause())
      audiosRef.current.clear()
    }
  }, [])

  useEffect(() => {
    // 다른 회차로 바뀔 때만 처음으로 리셋(같은 회차의 편집-take/gap-에는 위치 유지).
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    audiosRef.current.forEach((a) => a.pause())
    audiosRef.current.clear()
    currentMsRef.current = 0
    setCurrentMs(0)
    setPlaying(false)
    setSelectedLineId(null)
  }, [episode.id])

  // 편집(gap 등)으로 총 길이가 줄면 현재 위치를 끝으로 클램프.
  useEffect(() => {
    if (currentMsRef.current > totalMs) {
      currentMsRef.current = totalMs
      setCurrentMs(totalMs)
    }
  }, [totalMs])

  // 현재 시각에 활성인 모든 대사(겹치면 여러 개).
  const activeLines = flatLines.filter((l) => currentMs >= l.startMs && currentMs < l.endMs)
  const activeIds = new Set(activeLines.map((l) => l.lineId))
  const selectedFlat = selectedLineId ? flatLines.find((f) => f.lineId === selectedLineId) : undefined
  const currentCutId = cutAt(currentMs)
  const currentCut = currentCutId ? cutById.get(currentCutId) : undefined

  return (
    <div className="preview-player">
      <div className="pp-stage">
        {currentCut ? (
          <img className="pp-stage__image" src={currentCut.imageUrl} alt={`컷 ${currentCut.order}`} />
        ) : (
          <div className="pp-stage__empty">컷 없음</div>
        )}

        {activeLines.length > 0 && (
          <div className="pp-subtitle">
            {activeLines.length > 1 && (
              <span className="pp-subtitle__overlap">겹침 · 동시 발화 {activeLines.length}개</span>
            )}
            {activeLines.map((fl) => {
              const hasAudio = Boolean(fl.recording?.audioUrl?.startsWith('blob:'))
              return (
                <div key={fl.lineId} className="pp-subtitle__line">
                  <div className="pp-subtitle__meta">
                    {fl.line.character && <span className="pp-subtitle__character">{fl.line.character}</span>}
                    {fl.recording ? (
                      <span className="pp-subtitle__va">{fl.recording.voiceActorName}</span>
                    ) : (
                      <span className="pp-subtitle__undecided">최종 미정</span>
                    )}
                    {!hasAudio && <span className="pp-subtitle__silent">무음(샘플)</span>}
                  </div>
                  <p className="pp-subtitle__text">{fl.line.text}</p>
                </div>
              )
            })}
          </div>
        )}

        <span className="pp-stage__cutno">{currentCut ? `컷 ${currentCut.order}` : ''}</span>
      </div>

      <div className="pp-controls">
        <button type="button" className="pp-controls__play" onClick={toggle} aria-label={playing ? '일시정지' : '재생'}>
          <PlayIcon playing={playing} />
        </button>

        <span className="pp-controls__time">{formatMs(currentMs)}</span>

        <div className="pp-seek">
          {/* 컷 경계 마커 */}
          <div className="pp-seek__segments">
            {cutsTl.map((c, idx) => {
              const width = totalMs > 0 ? ((c.endMs - c.startMs) / totalMs) * 100 : 0
              const isCurrent = c.cutId === currentCutId
              return (
                <button
                  type="button"
                  key={c.cutId}
                  className={`pp-seek__seg${isCurrent ? ' pp-seek__seg--current' : ''}`}
                  style={{ width: `${width}%` }}
                  title={`컷 ${idx + 1} 로 이동`}
                  onClick={() => seek(c.startMs)}
                />
              )
            })}
          </div>
          <input
            className="pp-seek__range"
            type="range"
            min={0}
            max={Math.max(totalMs, 1)}
            value={currentMs}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="재생 위치"
          />
        </div>

        <span className="pp-controls__time pp-controls__time--total">{formatMs(totalMs)}</span>
      </div>

      <div className="pp-track">
        <div className="pp-track__lane" style={{ height: `${laneCount * LANE_H + 8}px` }}>
          {/* 컷 경계 배경 */}
          {cutsTl.map((c, idx) => {
            const left = totalMs > 0 ? (c.startMs / totalMs) * 100 : 0
            const width = totalMs > 0 ? ((c.endMs - c.startMs) / totalMs) * 100 : 0
            return (
              <div
                key={`bg-${c.cutId}`}
                className={`pp-track__cutbg pp-track__cutbg--${idx % 2 === 0 ? 'a' : 'b'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}

          {/* 대사 클립 (파형 + 라벨). 겹치는 클립은 별도 레인(행)으로 쌓인다. */}
          {flatLines.map((fl) => {
            const left = totalMs > 0 ? (fl.startMs / totalMs) * 100 : 0
            const width = totalMs > 0 ? ((fl.endMs - fl.startMs) / totalMs) * 100 : 0
            const active = activeIds.has(fl.lineId)
            const undecided = !fl.recording
            const editing = selectedLineId === fl.lineId
            const lane = laneOf.get(fl.lineId) ?? 0
            return (
              <button
                type="button"
                key={fl.lineId}
                className={`pp-clip${active ? ' pp-clip--active' : ''}${undecided ? ' pp-clip--undecided' : ''}${editing ? ' pp-clip--editing' : ''}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${lane * LANE_H + 4}px`,
                  height: `${LANE_H - 8}px`
                }}
                title={`${fl.line.character ? fl.line.character + ' · ' : ''}${fl.line.text}`}
                onClick={() => {
                  seek(fl.startMs)
                  if (editable) setSelectedLineId(fl.lineId)
                }}
              >
                <Waveform lineId={fl.lineId} recording={fl.recording} />
                <span className="pp-clip__label">
                  {fl.line.character && <strong className="pp-clip__char">{fl.line.character}</strong>}
                  <span className="pp-clip__text">{fl.line.text}</span>
                </span>
              </button>
            )
          })}

          {/* 플레이헤드 */}
          <div
            className="pp-track__playhead"
            style={{ left: `${totalMs > 0 ? (currentMs / totalMs) * 100 : 0}%` }}
          />
        </div>
      </div>

      {editable && selectedFlat && (
        <div className="pp-editor">
          <div className="pp-editor__head">
            <span className="pp-editor__title">
              {selectedFlat.line.character && <strong>{selectedFlat.line.character}</strong>}
              <span className="pp-editor__title-text">{selectedFlat.line.text}</span>
            </span>
            <button type="button" className="pp-editor__close" onClick={() => setSelectedLineId(null)}>
              닫기
            </button>
          </div>

          {onSelectTake && (
            <div className="pp-editor__section">
              <span className="pp-editor__label">목소리(최종 take)</span>
              <div className="pp-editor__takes">
                {selectedFlat.line.recordings.length === 0 ? (
                  <span className="pp-editor__empty">녹음 없음</span>
                ) : (
                  selectedFlat.line.recordings.map((rec) => {
                    const meta = RECORDING_STATUS_META[rec.status]
                    const isFinal = rec.id === selectedFlat.line.selectedRecordingId
                    return (
                      <button
                        type="button"
                        key={rec.id}
                        className={`pp-take${isFinal ? ' pp-take--final' : ''}`}
                        onClick={() => onSelectTake(selectedFlat.line.id, rec.id)}
                      >
                        <span className="pp-take__name">{rec.voiceActorName}</span>
                        <span
                          className="pp-take__badge"
                          style={{ color: meta.color, background: meta.background }}
                        >
                          {meta.label}
                        </span>
                        <span className="pp-take__dur">{formatMs(rec.durationMs)}</span>
                        {isFinal && <span className="pp-take__final">최종</span>}
                      </button>
                    )
                  })
                )}
                {selectedFlat.line.selectedRecordingId && (
                  <button
                    type="button"
                    className="pp-take pp-take--clear"
                    onClick={() => onSelectTake(selectedFlat.line.id, null)}
                  >
                    선택 해제
                  </button>
                )}
              </div>
            </div>
          )}

          {onChangeGap && (
            <div className="pp-editor__section">
              <span className="pp-editor__label">앞 간격(gap)</span>
              <div className="pp-editor__gap">
                <button
                  type="button"
                  className="pp-editor__gap-btn"
                  disabled={selectedFlat.line.gapBeforeMs <= -3000}
                  onClick={() => onChangeGap(selectedFlat.line.id, Math.max(-3000, selectedFlat.line.gapBeforeMs - 100))}
                >
                  −100ms
                </button>
                <span className="pp-editor__gap-val">{selectedFlat.line.gapBeforeMs}ms</span>
                <button
                  type="button"
                  className="pp-editor__gap-btn"
                  onClick={() => onChangeGap(selectedFlat.line.id, selectedFlat.line.gapBeforeMs + 100)}
                >
                  +100ms
                </button>
                {selectedFlat.line.gapBeforeMs < 0 && <span className="pp-editor__gap-tag">겹침</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="pp-note">
        컷·대사가 타임라인 순서로 이어서 재생됩니다. 최종 선택된 take 의 오디오가 흐르며, 실제 녹음(파일)이 없는
        대사는 무음으로 길이만 유지됩니다.
      </p>
    </div>
  )
}
