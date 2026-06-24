import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  EPISODE_STATUS_LABEL,
  RECORDING_STATUS_LABEL,
  getAssignedEpisode,
  type EpisodeStatus,
  type MockCharacter,
  type MockCut,
  type MockEpisodeMeta,
  type MockEpisodeScript,
  type MockLine,
  type RecordingStatus,
  type RecordingTake
} from '../features/episodes/recording.mock'
import { useCreatorCuts } from '../features/cuts/useCreatorCuts'
import type { CreatorCut } from '../api/cut.api'
import './RecordingPage.css'

const RECORDABLE = new Set(['READY', 'RECORDING', 'REVIEWING'])

interface RecNavState {
  episode?: { chapter: number; title: string; status: string }
  contentTitle?: string
}

function mapStatus(s?: string): EpisodeStatus {
  switch (s) {
    case 'recording':
      return 'RECORDING'
    case 'reviewing':
      return 'REVIEWING'
    case 'approved':
    case 'scheduled':
    case 'published':
    case 'archived':
      return 'PUBLISHED'
    default:
      return 'READY'
  }
}

/** 캐릭터 색 팔레트(응답에 캐릭터 메타가 없어 characterId 순서로 부여 — mock). */
const CHAR_PALETTE = [
  '#818cf8',
  '#f472b6',
  '#4ade80',
  '#fbbf24',
  '#38bdf8',
  '#c084fc',
  '#fb7185',
  '#2dd4bf'
]

/**
 * 실 컷(+대사)을 녹음 화면 스크립트로 변환.
 * 컷 이미지·대사는 실데이터. 캐릭터(이름/색)·내 배역·테이크는 응답에 없어 mock 으로 채운다.
 */
function buildScriptFromCuts(
  episodeId: number,
  cuts: CreatorCut[]
): { script: MockEpisodeScript; myCharId: number | null; role: string } {
  const charIds = [...new Set(cuts.flatMap((c) => c.lines.map((l) => l.characterId)))].sort(
    (a, b) => a - b
  )
  const characters: MockCharacter[] = charIds.map((cid, i) => ({
    id: cid,
    name: `캐릭터 ${i + 1}`,
    color: CHAR_PALETTE[i % CHAR_PALETTE.length]
  }))

  const counts = new Map<number, number>()
  cuts.forEach((c) =>
    c.lines.forEach((l) => counts.set(l.characterId, (counts.get(l.characterId) ?? 0) + 1))
  )
  const myCharId = charIds.length
    ? charIds.reduce(
        (best, cid) => ((counts.get(cid) ?? 0) > (counts.get(best) ?? 0) ? cid : best),
        charIds[0]
      )
    : null

  const scriptCuts: MockCut[] = [...cuts]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      position: c.order,
      placeholderColor: '#1e293b',
      imageUrl: c.imageUrl,
      imageWidth: c.imageWidth,
      imageHeight: c.imageHeight,
      lines: [...c.lines]
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          id: l.id,
          cutId: c.id,
          position: l.order,
          characterId: l.characterId,
          text: l.script,
          anchorY: l.anchorY,
          takes: []
        }))
    }))

  const role = characters.find((c) => c.id === myCharId)?.name ?? '내 배역'
  return { script: { episodeId, characters, cuts: scriptCuts }, myCharId, role }
}

function genMeta(id: number, state: RecNavState | null): MockEpisodeMeta {
  return {
    id,
    workId: 0,
    workTitle: state?.contentTitle ?? '내 콘텐츠',
    episodeNo: state?.episode?.chapter ?? id,
    title: state?.episode?.title ?? `${id}화`,
    role: '내 배역',
    status: mapStatus(state?.episode?.status),
    updatedAt: new Date().toISOString(),
    dueDate: new Date().toISOString()
  }
}

/** ms → 'M:SS.d' */
function fmtDuration(ms: number): string {
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}:${s.toString().padStart(2, '0')}.${d}`
}

/** 결정적 파형(테이크 재생용 — 정적) */
function fakeWaveform(seed: number, bars = 40): number[] {
  const out: number[] = []
  let x = seed * 9301 + 49297
  for (let i = 0; i < bars; i++) {
    x = (x * 9301 + 49297) % 233280
    out.push(0.18 + (x / 233280) * 0.82)
  }
  return out
}

function Waveform({ seed, active }: { seed: number; active?: boolean }): React.JSX.Element {
  const bars = useMemo(() => fakeWaveform(seed), [seed])
  return (
    <div className={`rec-wave${active ? ' rec-wave--on' : ''}`}>
      {bars.map((h, i) => (
        <span key={i} className="rec-wave__bar" style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </div>
  )
}

const LIVE_COUNT = 56
const LIVE_FLAT = new Array(LIVE_COUNT).fill(0.06)

/** 라이브 파형 — 녹음 중 막대가 오른쪽으로 흘러가며 갱신(mock 마이크 입력). */
function LiveWaveform({ active }: { active: boolean }): React.JSX.Element {
  const [bars, setBars] = useState<number[]>(LIVE_FLAT)
  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setBars((prev) => {
        const next = prev.slice(1)
        next.push(0.2 + Math.random() * 0.8)
        return next
      })
    }, 60)
    return () => clearInterval(iv)
  }, [active])
  const display = active ? bars : LIVE_FLAT
  return (
    <div className={`rec-live${active ? ' rec-live--on' : ''}`}>
      {display.map((h, i) => (
        <span key={i} className="rec-live__bar" style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </div>
  )
}

interface LineState {
  takes: RecordingTake[]
}

function linePrimaryStatus(line: LineState): RecordingStatus | 'NONE' {
  if (line.takes.length === 0) return 'NONE'
  const selected = line.takes.find((t) => t.selected)
  return (selected ?? line.takes[line.takes.length - 1]).status
}

/** 라우트 래퍼: episodeId 별로 내부 상태를 새로 초기화하도록 key 분리. */
export function RecordingPage(): React.JSX.Element {
  const { episodeId } = useParams<{ episodeId: string }>()
  return <RecordingScreen key={episodeId} />
}

/** 회차 녹음 화면 — 다크 프로 톤(vooth-tool 앵커 화면 레퍼런스). 컷 뷰어 + 대사 패널 + 라이브 레코더 바. */
function RecordingScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { episodeId } = useParams<{ episodeId: string }>()
  const id = Number(episodeId)
  const navState = (location.state as RecNavState | null) ?? null

  const meta = getAssignedEpisode(id) ?? genMeta(id, navState)
  const {
    data: cutData,
    isLoading: cutsLoading,
    isError: cutsError,
    error: cutsErr
  } = useCreatorCuts(id)
  const built = useMemo(
    () => buildScriptFromCuts(id, Array.isArray(cutData?.items) ? cutData.items : []),
    [id, cutData]
  )
  const { script, myCharId, role } = built

  const initialLineStates = useMemo(() => {
    const m: Record<number, LineState> = {}
    script.cuts.forEach((c) => c.lines.forEach((l) => (m[l.id] = { takes: l.takes })))
    return m
  }, [script])

  const [lineStates, setLineStates] = useState<Record<number, LineState>>(initialLineStates)
  const [cutIdx, setCutIdx] = useState(0)
  const [cutDraft, setCutDraft] = useState<string | null>(null)
  const [activeLineId, setActiveLineId] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)
  // 보기 모드: 컷 단위(커버플로우) / 스크롤 단위(웹툰형 연속). localStorage 유지.
  const [mode, setMode] = useState<'cut' | 'scroll'>(() =>
    localStorage.getItem('vooth-maker.recMode') === 'scroll' ? 'scroll' : 'cut'
  )
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stripActiveRef = useRef<HTMLButtonElement>(null)
  // 스크롤 모드: 컷 번호 점프용 컷 섹션 ref 맵.
  const scrollCutRefs = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    localStorage.setItem('vooth-maker.recMode', mode)
  }, [mode])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsedMs((v) => v + 100), 100)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const charById = new Map<number, MockCharacter>(script.characters.map((c) => [c.id, c]))
  const myCharIds = new Set<number>(myCharId != null ? [myCharId] : [])

  const orderedCuts = script.cuts
  const safeIdx = Math.min(cutIdx, Math.max(0, orderedCuts.length - 1))
  const currentCut = orderedCuts[safeIdx] ?? null
  const cutLines = currentCut?.lines ?? []

  // 컷 번호 입력값(편집 중이면 draft, 아니면 현재 컷 번호).
  const cutInputValue = cutDraft ?? (currentCut ? String(currentCut.position) : '')

  // 컷이 바뀌면 필름스트립에서 현재 컷을 가운데로 스크롤.
  useEffect(() => {
    stripActiveRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    })
  }, [safeIdx])

  const allLines = orderedCuts.flatMap((c) => c.lines)
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
    const newTake: RecordingTake = {
      id: Date.now(),
      status: 'RECORDED',
      durationMs: Math.max(elapsedMs, 500),
      recordedAt: new Date().toISOString(),
      selected: true
    }
    setLineStates((prev) => {
      const cur = prev[activeLineId]?.takes ?? []
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

  function gotoCut(idx: number): void {
    setCutIdx(idx)
    if (!isRecording) setActiveLineId(null)
  }

  // 컷 번호 입력 → 해당 컷으로 단숨에 점프. 스크롤 모드면 해당 컷으로 스크롤.
  function commitCutJump(): void {
    if (cutDraft != null) {
      const idx = orderedCuts.findIndex((c) => c.position === Number(cutDraft))
      if (idx >= 0) {
        setCutIdx(idx)
        if (mode === 'scroll') {
          scrollCutRefs.current
            .get(orderedCuts[idx].id)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (!isRecording) {
          setActiveLineId(null)
        }
      }
    }
    setCutDraft(null)
  }

  if (!Number.isFinite(id)) {
    return (
      <div className="rec rec--missing">
        <p>회차를 찾을 수 없습니다.</p>
        <button type="button" className="rec-btn" onClick={() => navigate('/works')}>
          내 콘텐츠로
        </button>
      </div>
    )
  }

  return (
    <div className="rec">
      {/* ── 상단 바 ── */}
      <header className="rec-top">
        <button type="button" className="rec-back" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>

        <div className="rec-top__title">
          <span className="rec-top__work">{meta.workTitle}</span>
          <h2 className="rec-top__name">
            {meta.episodeNo}화 · {meta.title}
          </h2>
          <span className="rec-top__role">
            🎭 {role} <span className="rec-mock">(M)</span>
          </span>
          {script.characters.length > 0 && (
            <div className="rec-top__chars">
              {script.characters.map((c) => (
                <span key={c.id} className="rec-chip">
                  <span className="rec-chip__dot" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
              <span className="rec-mock">(M)</span>
            </div>
          )}
        </div>

        <div className="rec-top__right">
          <div className="rec-modetoggle">
            <button
              type="button"
              className={`rec-modebtn${mode === 'cut' ? ' rec-modebtn--on' : ''}`}
              onClick={() => setMode('cut')}
            >
              ▦ 컷
            </button>
            <button
              type="button"
              className={`rec-modebtn${mode === 'scroll' ? ' rec-modebtn--on' : ''}`}
              onClick={() => setMode('scroll')}
            >
              ☰ 스크롤
            </button>
          </div>
          <span className={`rec-pill rec-pill--${meta.status.toLowerCase()}`}>
            {EPISODE_STATUS_LABEL[meta.status]}
          </span>
          <div className="rec-top__prog">
            <div className="rec-top__track">
              <div className="rec-top__bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="rec-top__count">
              {recordedCount}/{totalCount} ({pct}%)
            </span>
          </div>
          {isReviewing ? (
            <span className="rec-review">검수 대기</span>
          ) : (
            <button
              type="button"
              className="rec-btn rec-btn--primary"
              disabled={!recordable || !allRecorded}
              title={!allRecorded ? '모든 라인 녹음을 완료해야 검수 요청이 가능합니다.' : undefined}
            >
              검수 요청
            </button>
          )}
        </div>
      </header>

      {meta.rejectionNote && (
        <p className="rec-reject">
          <strong>검수 반려</strong> {meta.rejectionNote}
        </p>
      )}

      {/* ── 메인: 컷 뷰어 | 대사 패널 ── */}
      {cutsLoading ? (
        <div className="rec-empty">컷을 불러오는 중…</div>
      ) : cutsError ? (
        <div className="rec-empty rec-empty--error">
          컷을 불러오지 못했습니다. {cutsErr?.message}
        </div>
      ) : !currentCut ? (
        <div className="rec-empty">등록된 컷이 없습니다.</div>
      ) : mode === 'cut' ? (
        <div className="rec-main">
          {/* 컷 뷰어 */}
          <section className="rec-viewer">
            <div className="rec-jump">
              컷
              <input
                className="rec-jump__input"
                inputMode="numeric"
                value={cutInputValue}
                onChange={(e) => setCutDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                onBlur={commitCutJump}
              />
              <span className="rec-jump__total">/ {orderedCuts.length}</span>
            </div>

            <div className="rec-stagewrap">
              <button
                type="button"
                className="rec-arrow"
                disabled={safeIdx <= 0}
                onClick={() => gotoCut(safeIdx - 1)}
                aria-label="이전 컷"
              >
                ‹
              </button>

              <div className="rec-cf">
                {orderedCuts.map((c, i) => {
                  const off = i - safeIdx
                  const abs = Math.abs(off)
                  if (abs > 3) return null
                  const isActive = off === 0
                  const visible = abs <= 2
                  const sign = Math.sign(off)
                  const tx = abs === 0 ? 0 : sign * (66 + (abs - 1) * 40)
                  const tz = abs === 0 ? 0 : -(150 + (abs - 1) * 150)
                  const ry = abs === 0 ? 0 : -sign * (18 + (abs - 1) * 6)
                  const cardStyle: React.CSSProperties = {
                    transform: `translate(-50%, -50%) translateX(${tx}%) translateZ(${tz}px) rotateY(${ry}deg)`,
                    opacity: visible ? 1 : 0,
                    zIndex: 10 - abs,
                    pointerEvents: visible ? undefined : 'none'
                  }
                  return (
                    <div
                      key={c.id}
                      className={`rec-cf__card${isActive ? ' rec-cf__card--on' : ''}`}
                      style={cardStyle}
                      onClick={isActive ? undefined : () => gotoCut(i)}
                    >
                      {c.imageUrl ? (
                        <div
                          className="rec-cf__canvas"
                          style={
                            c.imageWidth && c.imageHeight
                              ? { aspectRatio: `${c.imageWidth} / ${c.imageHeight}` }
                              : undefined
                          }
                        >
                          <img
                            src={c.imageUrl}
                            alt={`컷 ${c.position}`}
                            draggable={false}
                            loading="lazy"
                          />
                          {/* 대사 앵커(발화 세로 위치) — 활성 컷에만 표시 */}
                          {isActive && (
                            <CutAnchors
                              lines={c.lines}
                              charById={charById}
                              myCharIds={myCharIds}
                              activeLineId={activeLineId}
                              onSelect={setActiveLineId}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="rec-cf__ph" style={{ background: c.placeholderColor }}>
                          {c.position}
                        </span>
                      )}
                      {isActive && (
                        <span className="rec-stage__badge">
                          컷 {c.position}
                          <span className="rec-stage__total"> / {orderedCuts.length}</span>
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                className="rec-arrow"
                disabled={safeIdx >= orderedCuts.length - 1}
                onClick={() => gotoCut(safeIdx + 1)}
                aria-label="다음 컷"
              >
                ›
              </button>
            </div>

            {/* 컷 필름스트립 */}
            <div className="rec-strip">
              {orderedCuts.map((c, i) => (
                <button
                  key={c.id}
                  ref={i === safeIdx ? stripActiveRef : undefined}
                  type="button"
                  className={`rec-strip__thumb${i === safeIdx ? ' rec-strip__thumb--on' : ''}`}
                  style={c.imageUrl ? undefined : { background: c.placeholderColor }}
                  onClick={() => gotoCut(i)}
                  title={`컷 ${c.position}`}
                >
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" draggable={false} loading="lazy" />
                  ) : (
                    <span>{c.position}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 대사 패널 */}
          <aside className="rec-lines">
            <div className="rec-lines__head">컷 {currentCut.position} · 대사</div>
            <ul className="rec-lines__list">
              {cutLines.map((line) => (
                <LineCard
                  key={line.id}
                  line={line}
                  char={charById.get(line.characterId)}
                  mine={myCharIds.has(line.characterId)}
                  takes={lineStates[line.id]?.takes ?? []}
                  recordable={recordable}
                  active={activeLineId === line.id}
                  isRecording={isRecording}
                  playingTakeId={playingTakeId}
                  onSelect={setActiveLineId}
                  onRecord={startRecording}
                  onPlay={togglePlay}
                />
              ))}
              {cutLines.length === 0 && (
                <li className="rec-line__empty">이 컷엔 대사가 없습니다.</li>
              )}
            </ul>
          </aside>
        </div>
      ) : (
        /* ── 스크롤 모드: 가이드 자동 스크롤(앵커마다 정지 + 우측 말풍선) ── */
        <GuideScroll
          cuts={orderedCuts}
          charById={charById}
          myCharIds={myCharIds}
          lineStates={lineStates}
          recordable={recordable}
          activeLineId={activeLineId}
          isRecording={isRecording}
          playingTakeId={playingTakeId}
          onSelect={setActiveLineId}
          onRecord={startRecording}
          onPlay={togglePlay}
        />
      )}

      {/* ── 하단 레코더 바(라이브 파형) ── */}
      <div className={`rec-bar${isRecording ? ' rec-bar--rec' : ''}`}>
        <div className="rec-bar__info">
          {activeLine && activeChar ? (
            <>
              <span className="rec-bar__speaker" style={{ color: activeChar.color }}>
                {activeChar.name}
              </span>
              <span className="rec-bar__text">{activeLine.text}</span>
            </>
          ) : (
            <span className="rec-bar__hint">녹음할 내 대사를 선택하세요.</span>
          )}
        </div>

        <div className="rec-bar__center">
          <LiveWaveform active={isRecording} />
          <span className={`rec-bar__timer${isRecording ? ' rec-bar__timer--on' : ''}`}>
            {fmtDuration(elapsedMs)}
          </span>
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
            <button
              type="button"
              className="rec-btn rec-btn--record"
              disabled={!recordable || activeLine == null}
              onClick={() => activeLine && startRecording(activeLine.id)}
            >
              ● {activeLine ? '녹음' : '대사 선택'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** 라인별 녹음 컨트롤(내 배역 라인). take 목록 + 녹음/재생/다시 녹음. */
function LineControls({
  takes,
  recordable,
  isActiveRecording,
  playingTakeId,
  onRecord,
  onPlay
}: {
  takes: RecordingTake[]
  recordable: boolean
  isActiveRecording: boolean
  playingTakeId: number | null
  onRecord: () => void
  onPlay: (takeId: number) => void
}): React.JSX.Element {
  const hasTakes = takes.length > 0
  return (
    <div className="rec-ctrl">
      {hasTakes ? (
        <ul className="rec-takes">
          {takes.map((t, i) => (
            <li key={t.id} className={`rec-take${t.selected ? ' rec-take--sel' : ''}`}>
              <button
                type="button"
                className={`rec-take__play${playingTakeId === t.id ? ' rec-take__play--on' : ''}`}
                onClick={() => onPlay(t.id)}
                aria-label="재생"
              >
                {playingTakeId === t.id ? '❚❚' : '▶'}
              </button>
              <span className="rec-take__no">T{i + 1}</span>
              <Waveform seed={t.id} active={playingTakeId === t.id} />
              <span className="rec-take__time">{fmtDuration(t.durationMs)}</span>
              {t.selected && <span className="rec-take__sel">채택</span>}
            </li>
          ))}
        </ul>
      ) : (
        <span className="rec-ctrl__pending">아직 녹음하지 않은 대사</span>
      )}

      <button
        type="button"
        className={`rec-btn rec-btn--sm${isActiveRecording ? ' rec-btn--recording' : ''}`}
        disabled={!recordable}
        onClick={onRecord}
      >
        {isActiveRecording ? '● 녹음 중…' : hasTakes ? '다시 녹음' : '● 녹음'}
      </button>
    </div>
  )
}

/** 컷 이미지 위 대사 앵커 마커(발화 세로 위치). 컷/스크롤 모드 공용. */
function CutAnchors({
  lines,
  charById,
  myCharIds,
  activeLineId,
  onSelect
}: {
  lines: MockLine[]
  charById: Map<number, MockCharacter>
  myCharIds: Set<number>
  activeLineId: number | null
  onSelect: (lineId: number) => void
}): React.JSX.Element {
  return (
    <>
      {lines.map((line) => {
        if (line.anchorY == null) return null
        const color = charById.get(line.characterId)?.color ?? '#94a3b8'
        const mine = myCharIds.has(line.characterId)
        const on = activeLineId === line.id
        return (
          <div
            key={line.id}
            className={`rec-anchor${on ? ' rec-anchor--on' : ''}`}
            style={{ top: `${line.anchorY * 100}%`, color }}
            title={line.text}
            onClick={(e) => {
              e.stopPropagation()
              if (mine) onSelect(line.id)
            }}
          >
            <span className="rec-anchor__line" />
            <span className="rec-anchor__label">L{line.position}</span>
            <span className="rec-anchor__dot" />
          </div>
        )
      })}
    </>
  )
}

/** 대사 라인 카드(화자·(M)·상대역·take 배지·텍스트 + 내 대사 녹음 컨트롤). 컷/스크롤 모드 공용. */
function LineCard({
  line,
  char,
  mine,
  takes,
  recordable,
  active,
  isRecording,
  playingTakeId,
  onSelect,
  onRecord,
  onPlay
}: {
  line: MockLine
  char: MockCharacter | undefined
  mine: boolean
  takes: RecordingTake[]
  recordable: boolean
  active: boolean
  isRecording: boolean
  playingTakeId: number | null
  onSelect: (lineId: number) => void
  onRecord: (lineId: number) => void
  onPlay: (takeId: number) => void
}): React.JSX.Element {
  const primary = linePrimaryStatus({ takes })
  return (
    <li
      className={`rec-line${active ? ' rec-line--active' : ''}${mine ? '' : ' rec-line--other'}`}
      onClick={mine ? () => onSelect(line.id) : undefined}
    >
      <div className="rec-line__head">
        <span className="rec-line__idx">L{line.position}</span>
        <span className="rec-line__speaker" style={{ color: char?.color }}>
          <span className="rec-line__dot" style={{ background: char?.color }} />
          {char?.name ?? '?'} <span className="rec-mock">(M)</span>
        </span>
        {!mine && <span className="rec-line__tag">상대역</span>}
        {primary !== 'NONE' && (
          <span className={`rec-take-badge rec-take-badge--${primary.toLowerCase()}`}>
            {RECORDING_STATUS_LABEL[primary]}
          </span>
        )}
      </div>

      <p className="rec-line__text">{line.text}</p>

      {mine && (
        <LineControls
          takes={takes}
          recordable={recordable}
          isActiveRecording={isRecording && active}
          playingTakeId={playingTakeId}
          onRecord={() => onRecord(line.id)}
          onPlay={onPlay}
        />
      )}
    </li>
  )
}

/** 자동 스크롤 속도(px/sec). 조절하려면 이 값만 바꾸면 된다. */
const GUIDE_SPEED = 90
/** 읽는 줄(플레이헤드) 위치 — 뷰포트 상단에서의 비율. */
const GUIDE_PLAYHEAD = 0.4

interface GuideStop {
  lineId: number
  y: number
  mine: boolean
}

/**
 * 가이드 자동 스크롤 녹음 — 컷을 이어 붙인 세로 스트립을 일정 속도로 자동 스크롤하고,
 * 각 대사 anchorY가 플레이헤드(읽는 줄)에 닿으면 멈춘다. 멈춘 대사는 오른쪽 말풍선으로
 * 뜨고(내 대사면 녹음 컨트롤 포함), 재생을 다시 누르면 다음 앵커까지 이어서 스크롤한다.
 * 스크롤은 transform(translateY)로 직접 제어(부드러운 rAF), 휠로 수동 이동 시 자동 멈춤.
 */
function GuideScroll({
  cuts,
  charById,
  myCharIds,
  lineStates,
  recordable,
  activeLineId,
  isRecording,
  playingTakeId,
  onSelect,
  onRecord,
  onPlay
}: {
  cuts: MockCut[]
  charById: Map<number, MockCharacter>
  myCharIds: Set<number>
  lineStates: Record<number, LineState>
  recordable: boolean
  activeLineId: number | null
  isRecording: boolean
  playingTakeId: number | null
  onSelect: (lineId: number) => void
  onRecord: (lineId: number) => void
  onPlay: (takeId: number) => void
}): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const cutWrapRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const posRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const stopsRef = useRef<GuideStop[]>([])
  const nextStopRef = useRef(0)

  const [playing, setPlaying] = useState(false)
  const [stoppedLineId, setStoppedLineId] = useState<number | null>(null)

  const lineById = useMemo(() => {
    const m = new Map<number, MockLine>()
    cuts.forEach((c) => c.lines.forEach((l) => m.set(l.id, l)))
    return m
  }, [cuts])

  const maxScroll = (): number => {
    const vp = viewportRef.current
    const strip = stripRef.current
    if (!vp || !strip) return 0
    return Math.max(0, strip.offsetHeight - vp.clientHeight)
  }
  const applyPos = (): void => {
    if (stripRef.current) {
      stripRef.current.style.transform = `translate(-50%, ${-posRef.current}px)`
    }
  }
  const playheadPx = (): number => (viewportRef.current?.clientHeight ?? 0) * GUIDE_PLAYHEAD
  const computeStops = (): void => {
    const stops: GuideStop[] = []
    for (const c of cuts) {
      const el = cutWrapRefs.current.get(c.id)
      if (!el) continue
      const top = el.offsetTop
      const h = el.offsetHeight
      for (const line of c.lines) {
        if (line.anchorY == null) continue
        stops.push({
          lineId: line.id,
          y: top + line.anchorY * h,
          mine: myCharIds.has(line.characterId)
        })
      }
    }
    stops.sort((a, b) => a.y - b.y)
    stopsRef.current = stops
  }

  // 자동 스크롤 루프(rAF). playing 일 때만 동작, 다음 앵커에서 멈춘다.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    computeStops()
    const ph = playheadPx()
    let idx = stopsRef.current.findIndex((s) => s.y - ph > posRef.current + 1)
    if (idx < 0) idx = stopsRef.current.length
    nextStopRef.current = idx
    lastTsRef.current = performance.now()

    const step = (ts: number): void => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05)
      lastTsRef.current = ts
      const max = maxScroll()
      const hasStop = nextStopRef.current < stopsRef.current.length
      const rawTarget = hasStop ? stopsRef.current[nextStopRef.current].y - ph : max
      const target = Math.max(0, Math.min(rawTarget, max))
      posRef.current = Math.min(posRef.current + GUIDE_SPEED * dt, target)
      applyPos()
      if (posRef.current >= target - 0.5) {
        posRef.current = target
        applyPos()
        if (hasStop) {
          const stop = stopsRef.current[nextStopRef.current]
          setStoppedLineId(stop.lineId)
          if (stop.mine) onSelect(stop.lineId)
        }
        setPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  // 리사이즈 시 위치 보정.
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(() => {
      posRef.current = Math.min(posRef.current, maxScroll())
      applyPos()
    })
    ro.observe(vp)
    return () => ro.disconnect()
  }, [])

  const play = (): void => {
    setStoppedLineId(null)
    setPlaying(true)
  }
  const togglePlaying = (): void => {
    if (playing) setPlaying(false)
    else play()
  }
  const onWheel = (e: React.WheelEvent): void => {
    if (playing) setPlaying(false)
    posRef.current = Math.max(0, Math.min(posRef.current + e.deltaY, maxScroll()))
    applyPos()
  }

  const stoppedLine = stoppedLineId != null ? lineById.get(stoppedLineId) : null
  const stoppedChar = stoppedLine ? charById.get(stoppedLine.characterId) : undefined
  const stoppedMine = stoppedLine ? myCharIds.has(stoppedLine.characterId) : false

  return (
    <div className="rec-guide">
      <div className="rec-guide__viewport" ref={viewportRef} onWheel={onWheel}>
        <div className="rec-guide__strip" ref={stripRef}>
          {cuts.map((c) => (
            <div
              key={c.id}
              className="rec-gcut"
              ref={(el) => {
                if (el) cutWrapRefs.current.set(c.id, el)
                else cutWrapRefs.current.delete(c.id)
              }}
              style={
                c.imageWidth && c.imageHeight
                  ? { aspectRatio: `${c.imageWidth} / ${c.imageHeight}` }
                  : { aspectRatio: '0.7' }
              }
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={`컷 ${c.position}`} draggable={false} loading="lazy" />
              ) : (
                <span className="rec-gcut__ph" style={{ background: c.placeholderColor }}>
                  컷 {c.position}
                </span>
              )}
              <CutAnchors
                lines={c.lines}
                charById={charById}
                myCharIds={myCharIds}
                activeLineId={activeLineId}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>

        {/* 읽는 줄(플레이헤드) */}
        <div className="rec-guide__playhead" style={{ top: `${GUIDE_PLAYHEAD * 100}%` }} />

        {/* 멈춘 대사 말풍선 */}
        {stoppedLine && (
          <div className="rec-bubble" style={{ top: `${GUIDE_PLAYHEAD * 100}%` }}>
            <div className="rec-bubble__head">
              <span className="rec-line__speaker" style={{ color: stoppedChar?.color }}>
                <span className="rec-line__dot" style={{ background: stoppedChar?.color }} />
                {stoppedChar?.name ?? '?'} <span className="rec-mock">(M)</span>
              </span>
              {!stoppedMine && <span className="rec-line__tag">상대역</span>}
            </div>
            <p className="rec-bubble__text">{stoppedLine.text}</p>
            {stoppedMine && (
              <LineControls
                takes={lineStates[stoppedLine.id]?.takes ?? []}
                recordable={recordable}
                isActiveRecording={isRecording && activeLineId === stoppedLine.id}
                playingTakeId={playingTakeId}
                onRecord={() => onRecord(stoppedLine.id)}
                onPlay={onPlay}
              />
            )}
            <button type="button" className="rec-bubble__next" onClick={play}>
              다음 ▶
            </button>
          </div>
        )}

        {/* 재생/일시정지 */}
        <div className="rec-guide__ctrl">
          <button type="button" className="rec-btn rec-btn--primary" onClick={togglePlaying}>
            {playing ? '❚❚ 일시정지' : '▶ 재생'}
          </button>
        </div>
      </div>
    </div>
  )
}
