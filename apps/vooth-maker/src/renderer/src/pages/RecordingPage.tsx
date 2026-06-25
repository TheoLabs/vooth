import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  EPISODE_STATUS_LABEL,
  RECORDING_STATUS_LABEL,
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
import { useCreatorEpisode } from '../features/episodes/useCreatorEpisodes'
import type { CreatorCut, CreatorCharacter } from '../api/cut.api'
import type { CreatorEpisodeDetail } from '../api/episode.api'
import './RecordingPage.css'

const RECORDABLE = new Set(['READY', 'RECORDING', 'REVIEWING'])
/** 대사 1개당 최대 녹음본 수 = 저장된 take + 아직 저장 안 한(임시) take 합산. */
const MAX_TAKES = 3

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

/** 캐릭터 색 팔레트(응답에 color 가 없어 order 순서로 부여). */
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
 * 실 컷(+대사)+캐릭터를 녹음 화면 스크립트로 변환.
 * 컷 이미지·대사·캐릭터(이름)·내 배역(isMine)은 실데이터. 색은 부여, 테이크(녹음본)는 아직 mock.
 */
function buildScriptFromCuts(
  episodeId: number,
  cuts: CreatorCut[],
  characters: CreatorCharacter[]
): { script: MockEpisodeScript; myCharIds: Set<number>; role: string } {
  const ordered = [...characters].sort((a, b) => a.order - b.order)
  const colorById = new Map<number, string>()
  ordered.forEach((c, i) => colorById.set(c.id, CHAR_PALETTE[i % CHAR_PALETTE.length]))
  const scriptChars: MockCharacter[] = ordered.map((c) => ({
    id: c.id,
    name: c.name,
    color: colorById.get(c.id) ?? CHAR_PALETTE[0]
  }))

  // 내 배역 = isMine 대사의 캐릭터들.
  const myCharIds = new Set<number>()
  cuts.forEach((c) => c.lines.forEach((l) => l.isMine && myCharIds.add(l.characterId)))

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

  const role =
    scriptChars
      .filter((c) => myCharIds.has(c.id))
      .map((c) => c.name)
      .join(', ') || '내 배역'
  return { script: { episodeId, characters: scriptChars, cuts: scriptCuts }, myCharIds, role }
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

/** 실제 회차 상세(creators/.../episodes/:id) → 녹음 화면 메타. 작품명은 navState, 배역은 응답에 없어 mock. */
function metaFromEpisode(ep: CreatorEpisodeDetail, state: RecNavState | null): MockEpisodeMeta {
  return {
    id: ep.id,
    workId: ep.contentId,
    workTitle: state?.contentTitle ?? '내 콘텐츠',
    episodeNo: ep.chapter,
    title: ep.title,
    role: '내 배역',
    status: mapStatus(ep.status),
    updatedAt: ep.updatedAt ?? new Date().toISOString(),
    dueDate: ep.expectedPublishOn ?? ep.updatedAt ?? new Date().toISOString()
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

/**
 * 대사 한 줄의 재생 길이(ms).
 * - 채택/최근 take(녹음본)이 있으면 그 실측 길이.
 * - 없으면 "기본 duration + 글자수 기반 duration" 합산 추정(mock). estimated=true.
 *   (기본 = 발화 시작/끝 여유, 글자수분 = 실제 읽는 시간)
 */
const PREVIEW_BASE_MS = 600
const PREVIEW_MS_PER_CHAR = 80
function lineDurationMs(
  line: MockLine,
  takes?: RecordingTake[]
): { ms: number; estimated: boolean } {
  const sel =
    takes?.find((t) => t.selected) ?? (takes && takes.length ? takes[takes.length - 1] : undefined)
  if (sel) return { ms: sel.durationMs, estimated: false }
  const len = line.text.trim().length
  return { ms: PREVIEW_BASE_MS + Math.round(len * PREVIEW_MS_PER_CHAR), estimated: true }
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
  const { contentId: contentIdParam, episodeId } = useParams<{
    contentId: string
    episodeId: string
  }>()
  const id = Number(episodeId)
  const contentId = Number(contentIdParam)
  const navState = (location.state as RecNavState | null) ?? null

  // 회차 상세(creators/contents/:contentId/episodes/:episodeId) — URL 파라미터로 항상 조회.
  // 상세 로딩 전에는 navState(목록에서 넘긴 실제 회차 제목/번호/상태)로 표시. mock 회차는 쓰지 않는다.
  const { data: episode } = useCreatorEpisode(contentId, id)
  const meta = episode ? metaFromEpisode(episode, navState) : genMeta(id, navState)
  const {
    data: cutData,
    isLoading: cutsLoading,
    isError: cutsError,
    error: cutsErr
  } = useCreatorCuts(id)
  const built = useMemo(
    () =>
      buildScriptFromCuts(
        id,
        Array.isArray(cutData?.cuts) ? cutData.cuts : [],
        Array.isArray(cutData?.characters) ? cutData.characters : []
      ),
    [id, cutData]
  )
  const { script, myCharIds, role } = built

  const initialLineStates = useMemo(() => {
    const m: Record<number, LineState> = {}
    script.cuts.forEach((c) =>
      c.lines.forEach((l) => {
        // mock: 내 대사 일부(약 1/3)는 이미 녹음·저장된 상태로 시드 — 상태 UI 데모용.
        // 실제 녹음 저장 시 갱신되고, 녹음 저장 API 연동 시 이 시드는 제거한다.
        const seeded = myCharIds.has(l.characterId) && l.id % 3 === 0
        m[l.id] = {
          takes: seeded
            ? [
                {
                  id: l.id * 1000 + 1,
                  status: 'RECORDED',
                  durationMs:
                    PREVIEW_BASE_MS + Math.round(l.text.trim().length * PREVIEW_MS_PER_CHAR),
                  recordedAt: new Date().toISOString(),
                  selected: true
                }
              ]
            : l.takes
        }
      })
    )
    return m
  }, [script, myCharIds])

  const [lineStates, setLineStates] = useState<Record<number, LineState>>(initialLineStates)
  const [cutIdx, setCutIdx] = useState(0)
  const [cutDraft, setCutDraft] = useState<string | null>(null)
  const [activeLineId, setActiveLineId] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)
  // 녹음 직후 아직 저장 안 한 take(들어보고 저장/다시 녹음). 대사별 1개.
  const [pendingTake, setPendingTake] = useState<{ lineId: number; take: RecordingTake } | null>(
    null
  )
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

  function startRecording(lineId: number): void {
    setActiveLineId(lineId)
    setPendingTake(null)
    setElapsedMs(0)
    setIsRecording(true)
    setPlayingTakeId(null)
  }

  // 정지 → 임시 take 생성(아직 저장 X). 들어보고 저장/다시 녹음.
  function stopRecording(): void {
    if (activeLineId == null) return
    const take: RecordingTake = {
      id: Date.now(),
      status: 'RECORDED',
      durationMs: Math.max(elapsedMs, 500),
      recordedAt: new Date().toISOString(),
      selected: true
    }
    setPendingTake({ lineId: activeLineId, take })
    setIsRecording(false)
    setElapsedMs(0)
  }

  // 임시 take 저장 → 해당 대사의 take 목록에 커밋(채택). TODO: POST 녹음 저장 API 연동.
  function saveTake(): void {
    if (!pendingTake) return
    const { lineId, take } = pendingTake
    setLineStates((prev) => {
      const cur = prev[lineId]?.takes ?? []
      const cleared = cur.map((t) => ({ ...t, selected: false }))
      return { ...prev, [lineId]: { takes: [...cleared, take] } }
    })
    setPendingTake(null)
    setPlayingTakeId(null)
  }

  // 녹음본 채택 — 해당 take 만 selected. TODO: 채택 API 연동.
  function selectTake(lineId: number, takeId: number): void {
    setLineStates((prev) => {
      const cur = prev[lineId]?.takes ?? []
      return { ...prev, [lineId]: { takes: cur.map((t) => ({ ...t, selected: t.id === takeId })) } }
    })
  }

  // 녹음본 삭제 — take 제거. 채택본을 지우면 마지막 take 를 채택. TODO: DELETE API 연동.
  function deleteTake(lineId: number, takeId: number): void {
    setLineStates((prev) => {
      const next = (prev[lineId]?.takes ?? []).filter((t) => t.id !== takeId)
      if (next.length > 0 && !next.some((t) => t.selected)) {
        next[next.length - 1] = { ...next[next.length - 1], selected: true }
      }
      return { ...prev, [lineId]: { takes: next } }
    })
    setPlayingTakeId((cur) => (cur === takeId ? null : cur))
  }

  // 다시 녹음 — 임시 take 버리고 같은 대사 재녹음.
  function reRecord(): void {
    const lineId = pendingTake?.lineId ?? activeLineId
    setPendingTake(null)
    setPlayingTakeId(null)
    if (lineId != null) startRecording(lineId)
  }

  // 녹음 중 취소 / 임시 take 버리기.
  function cancelRecording(): void {
    setIsRecording(false)
    setPendingTake(null)
    setPlayingTakeId(null)
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
          <span className="rec-top__role">🎭 {role}</span>
          {script.characters.length > 0 && (
            <div className="rec-top__chars">
              {script.characters.map((c) => (
                <span key={c.id} className="rec-chip">
                  <span className="rec-chip__dot" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
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
                  elapsedMs={elapsedMs}
                  pendingTake={pendingTake}
                  playingTakeId={playingTakeId}
                  onSelect={setActiveLineId}
                  onRecord={startRecording}
                  onStop={stopRecording}
                  onSave={saveTake}
                  onReRecord={reRecord}
                  onCancel={cancelRecording}
                  onPlay={togglePlay}
                  onSelectTake={selectTake}
                  onDeleteTake={deleteTake}
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
          elapsedMs={elapsedMs}
          pendingTake={pendingTake}
          playingTakeId={playingTakeId}
          onSelect={setActiveLineId}
          onRecord={startRecording}
          onStop={stopRecording}
          onSave={saveTake}
          onReRecord={reRecord}
          onCancel={cancelRecording}
          onPlay={togglePlay}
          onSelectTake={selectTake}
          onDeleteTake={deleteTake}
        />
      )}
    </div>
  )
}

/**
 * 인라인 녹음 컨트롤 — 말풍선(컷 오른쪽) 안에서 한 대사의 녹음/들어보기/저장을 모두 처리.
 * 상태 머신: (저장된 take 목록 + 녹음) → 녹음 중(정지/취소) → 임시 take(들어보기·저장·다시 녹음).
 */
function RecorderControls({
  takes,
  recordable,
  isRecording,
  elapsedMs,
  pending,
  playingTakeId,
  onStart,
  onStop,
  onSave,
  onReRecord,
  onCancel,
  onPlay,
  onSelectTake,
  onDeleteTake
}: {
  takes: RecordingTake[]
  recordable: boolean
  isRecording: boolean
  elapsedMs: number
  pending: RecordingTake | null
  playingTakeId: number | null
  onStart: () => void
  onStop: () => void
  onSave: () => void
  onReRecord: () => void
  onCancel: () => void
  onPlay: (takeId: number) => void
  onSelectTake: (takeId: number) => void
  onDeleteTake: (takeId: number) => void
}): React.JSX.Element {
  if (isRecording) {
    return (
      <div className="rec-rc rec-rc--rec">
        <div className="rec-rc__live">
          <LiveWaveform active />
          <span className="rec-rc__timer">{fmtDuration(elapsedMs)}</span>
        </div>
        <div className="rec-rc__row">
          <button type="button" className="rec-btn rec-btn--sm rec-btn--stop" onClick={onStop}>
            ■ 정지
          </button>
          <button type="button" className="rec-btn rec-btn--sm rec-btn--ghost" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="rec-rc rec-rc--review">
        <div className="rec-rc__take">
          <button
            type="button"
            className={`rec-take__play${playingTakeId === pending.id ? ' rec-take__play--on' : ''}`}
            onClick={() => onPlay(pending.id)}
            aria-label="들어보기"
          >
            {playingTakeId === pending.id ? '❚❚' : '▶'}
          </button>
          <Waveform seed={pending.id} active={playingTakeId === pending.id} />
          <span className="rec-take__time">{fmtDuration(pending.durationMs)}</span>
        </div>
        <div className="rec-rc__row">
          <button
            type="button"
            className="rec-btn rec-btn--sm rec-btn--record"
            onClick={onReRecord}
          >
            ● 다시 녹음
          </button>
          <button type="button" className="rec-btn rec-btn--sm rec-btn--save" onClick={onSave}>
            ✓ 저장
          </button>
        </div>
      </div>
    )
  }

  const atMax = takes.length >= MAX_TAKES
  return (
    <div className="rec-rc">
      {takes.length > 0 && (
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
              {t.selected ? (
                <span className="rec-take__sel">채택</span>
              ) : (
                <button type="button" className="rec-take__pick" onClick={() => onSelectTake(t.id)}>
                  채택
                </button>
              )}
              <button
                type="button"
                className="rec-take__del"
                onClick={() => onDeleteTake(t.id)}
                aria-label="삭제"
                title="녹음본 삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="rec-btn rec-btn--sm rec-btn--record"
        disabled={!recordable || atMax}
        onClick={onStart}
      >
        {atMax
          ? `최대 ${MAX_TAKES}개 (${takes.length}/${MAX_TAKES})`
          : takes.length > 0
            ? `● 녹음 (${takes.length}/${MAX_TAKES})`
            : '● 녹음'}
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
  onSelect,
  selectableAll = false
}: {
  lines: MockLine[]
  charById: Map<number, MockCharacter>
  myCharIds: Set<number>
  activeLineId: number | null
  onSelect: (lineId: number) => void
  /** true 면 상대역 앵커도 클릭 가능(가이드 모드 — 클릭으로 이동/선택). */
  selectableAll?: boolean
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
              if (selectableAll || mine) onSelect(line.id)
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
  elapsedMs,
  pendingTake,
  playingTakeId,
  onSelect,
  onRecord,
  onStop,
  onSave,
  onReRecord,
  onCancel,
  onPlay,
  onSelectTake,
  onDeleteTake
}: {
  line: MockLine
  char: MockCharacter | undefined
  mine: boolean
  takes: RecordingTake[]
  recordable: boolean
  active: boolean
  isRecording: boolean
  elapsedMs: number
  pendingTake: { lineId: number; take: RecordingTake } | null
  playingTakeId: number | null
  onSelect: (lineId: number) => void
  onRecord: (lineId: number) => void
  onStop: () => void
  onSave: () => void
  onReRecord: () => void
  onCancel: () => void
  onPlay: (takeId: number) => void
  onSelectTake: (lineId: number, takeId: number) => void
  onDeleteTake: (lineId: number, takeId: number) => void
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
          {char?.name ?? '?'}
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
        <RecorderControls
          takes={takes}
          recordable={recordable}
          isRecording={isRecording && active}
          elapsedMs={elapsedMs}
          pending={pendingTake && pendingTake.lineId === line.id ? pendingTake.take : null}
          playingTakeId={playingTakeId}
          onStart={() => onRecord(line.id)}
          onStop={onStop}
          onSave={onSave}
          onReRecord={onReRecord}
          onCancel={onCancel}
          onPlay={onPlay}
          onSelectTake={(tid) => onSelectTake(line.id, tid)}
          onDeleteTake={(tid) => onDeleteTake(line.id, tid)}
        />
      )}
    </li>
  )
}

/** 자동 스크롤 속도(px/sec). 조절하려면 이 값만 바꾸면 된다. */
const GUIDE_SPEED = 90
/** 읽는 줄(플레이헤드) 위치 — 뷰포트 상단에서의 비율. */
const GUIDE_PLAYHEAD = 0.4
/** 자동 스크롤 배속 옵션. */
const GUIDE_SPEEDS = [0.5, 1, 1.5, 2]
/**
 * 좌측 타임라인 & 미리보기 슬로우 구간 공통 스케일: 녹음 1초 = 몇 px, 최소 블럭 높이(px).
 * 대사 구간 높이 = durMs×TL_PX_PER_SEC 이고, 미리보기는 이 구간을 durMs 동안(= TL_PX_PER_SEC 속도로) 통과한다.
 * → 플레이헤드가 좌측 블럭을 정확히 그 대사 길이만큼 위→아래로 지나가 싱크가 맞는다.
 */
const TL_PX_PER_SEC = 44
const TL_MIN_PX = 10

/** 대사 목록 라인별 녹음 상태 라벨. */
type RecLineStatus = 'recording' | 'pending' | 'saved' | 'none'
const REC_ST_LABEL: Record<RecLineStatus, string> = {
  recording: '● 녹음 중',
  pending: '● 미저장',
  saved: '✓ 저장됨',
  none: '미녹음'
}

interface GuideStop {
  lineId: number
  y: number
  mine: boolean
  /** 이 대사의 재생 길이(ms) — 미리보기 페이싱에서 구간 통과 시간으로 사용. */
  durMs: number
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
  elapsedMs,
  pendingTake,
  playingTakeId,
  onSelect,
  onRecord,
  onStop,
  onSave,
  onReRecord,
  onCancel,
  onPlay,
  onSelectTake,
  onDeleteTake
}: {
  cuts: MockCut[]
  charById: Map<number, MockCharacter>
  myCharIds: Set<number>
  lineStates: Record<number, LineState>
  recordable: boolean
  activeLineId: number | null
  isRecording: boolean
  elapsedMs: number
  pendingTake: { lineId: number; take: RecordingTake } | null
  playingTakeId: number | null
  onSelect: (lineId: number) => void
  onRecord: (lineId: number) => void
  onStop: () => void
  onSave: () => void
  onReRecord: () => void
  onCancel: () => void
  onPlay: (takeId: number) => void
  onSelectTake: (lineId: number, takeId: number) => void
  onDeleteTake: (lineId: number, takeId: number) => void
}): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const cutWrapRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // 읽는 위치(콘텐츠 좌표). 스크롤량이 아니라 "지금 읽는 지점". 스크롤·플레이헤드 위치는 여기서 파생.
  const cyRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const stopsRef = useRef<GuideStop[]>([])
  const nextStopRef = useRef(0)
  const panelActiveRef = useRef<HTMLButtonElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  // 읽는 위치의 현재 화면상 세로 위치(px) — 말풍선/플레이헤드 위치 동기화용.
  const screenYRef = useRef(0)
  // 연속 재생(preview)에서 자막으로 띄운 대사 — 바뀔 때만 setState 하도록 추적.
  const captionRef = useRef<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [stoppedLineId, setStoppedLineId] = useState<number | null>(null)
  // 끝까지 재생됨 — 재생 버튼을 '처음으로'로 바꾼다.
  const [atEnd, setAtEnd] = useState(false)
  // 실측 스트립 폭 — 좌측 타임라인 블럭의 컷 높이/위치 계산용.
  const [stripW, setStripW] = useState(0)
  // 대사 목록 필터 — 'mine'(내 대사만) | 'all'(전체). rAF 루프는 ref로 즉시 반영(재생 중 변경 대응).
  const [lineFilter, setLineFilter] = useState<'mine' | 'all'>('all')
  const lineFilterRef = useRef(lineFilter)
  const changeFilter = (f: 'mine' | 'all'): void => {
    setLineFilter(f)
    lineFilterRef.current = f
  }
  // 자동 스크롤 배속(UI는 state, rAF 루프는 ref로 즉시 반영).
  const [speed, setSpeed] = useState(
    () => Number(localStorage.getItem('vooth-maker.guideSpeed')) || 1
  )
  const speedRef = useRef(speed)
  const changeSpeed = (s: number): void => {
    setSpeed(s)
    speedRef.current = s
    localStorage.setItem('vooth-maker.guideSpeed', String(s))
  }
  // 페이싱 — 'fixed'(균일 속도) | 'preview'(대사 길이=녹음본/추정 duration 에 맞춰 구간 속도 가변).
  const [pace, setPace] = useState<'fixed' | 'preview'>(() =>
    localStorage.getItem('vooth-maker.guidePace') === 'fixed' ? 'fixed' : 'preview'
  )
  const paceRef = useRef(pace)
  const changePace = (p: 'fixed' | 'preview'): void => {
    setPace(p)
    paceRef.current = p
    localStorage.setItem('vooth-maker.guidePace', p)
  }

  const lineById = useMemo(() => {
    const m = new Map<number, MockLine>()
    cuts.forEach((c) => c.lines.forEach((l) => m.set(l.id, l)))
    return m
  }, [cuts])

  // 라인별 녹음 상태(대사 목록 배지용): 녹음 중 / 미저장(임시 take) / 저장됨 / 미녹음.
  const recStatus = (lineId: number): RecLineStatus => {
    if (isRecording && activeLineId === lineId) return 'recording'
    if (pendingTake?.lineId === lineId) return 'pending'
    if ((lineStates[lineId]?.takes.length ?? 0) > 0) return 'saved'
    return 'none'
  }

  // 좌측 세로 타임라인 블럭 — 각 대사를 앵커(시작점)에 두고 녹음 길이(durMs)만큼의 높이로.
  // 컷 높이 = 실측 스트립 폭 / 이미지비율 → 실제 레이아웃과 정확히 일치(누적 위치 오차 없음).
  const timeline = useMemo(() => {
    let acc = 0
    const blocks: {
      lineId: number
      top: number
      height: number
      color: string
      mine: boolean
      estimated: boolean
      durMs: number
    }[] = []
    for (const c of cuts) {
      const ar = c.imageWidth && c.imageHeight ? c.imageWidth / c.imageHeight : 0.7
      const h = stripW > 0 ? stripW / ar : 0
      for (const line of c.lines) {
        if (line.anchorY == null) continue
        const d = lineDurationMs(line, lineStates[line.id]?.takes)
        blocks.push({
          lineId: line.id,
          top: acc + line.anchorY * h,
          height: Math.max(TL_MIN_PX, (d.ms / 1000) * TL_PX_PER_SEC),
          color: charById.get(line.characterId)?.color ?? '#94a3b8',
          mine: myCharIds.has(line.characterId),
          estimated: d.estimated,
          durMs: d.ms
        })
      }
      acc += h
    }
    return blocks
  }, [cuts, lineStates, stripW, charById, myCharIds])

  const contentH = (): number => stripRef.current?.offsetHeight ?? 0
  const maxScroll = (): number => Math.max(0, contentH() - (viewportRef.current?.clientHeight ?? 0))
  const playheadPx = (): number => (viewportRef.current?.clientHeight ?? 0) * GUIDE_PLAYHEAD
  // 읽는 위치(cy)에 대한 스크롤량 — 시작/끝에선 0/max 로 고정돼 플레이헤드가 위/아래로 움직인다.
  const scrollFor = (cy: number): number => Math.max(0, Math.min(cy - playheadPx(), maxScroll()))
  const applyPos = (): void => {
    const scroll = scrollFor(cyRef.current)
    if (stripRef.current) stripRef.current.style.transform = `translate(-50%, ${-scroll}px)`
    const screenY = cyRef.current - scroll
    screenYRef.current = screenY
    if (playheadRef.current) playheadRef.current.style.top = `${screenY}px`
    if (bubbleRef.current) bubbleRef.current.style.top = `${screenY}px`
  }
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
          mine: myCharIds.has(line.characterId),
          durMs: lineDurationMs(line, lineStates[line.id]?.takes).ms
        })
      }
    }
    stops.sort((a, b) => a.y - b.y)
    stopsRef.current = stops
  }

  // 자동 스크롤 루프(rAF). 두 모드 모두 각 대사 앵커부터 SLOW_ZONE(=녹음본/대사 길이) 동안 느려진다.
  //  - 녹음모드(fixed): 슬로우 구간 반영하며 다음 앵커에서 멈춘다(정지-녹음 가이드).
  //  - 미리보기(preview): 멈추지 않고 끝까지 연속 재생 + 슬로우 구간 동안 자막 표시.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    computeStops()
    const stops = stopsRef.current
    // 필터는 ref로 읽어 재생 중 변경(내 대사/전체)도 즉시 반영.
    const matches = (s: GuideStop): boolean => lineFilterRef.current === 'all' || s.mine
    let idx = stops.findIndex((s) => s.y > cyRef.current + 1 && matches(s))
    if (idx < 0) idx = stops.length
    nextStopRef.current = idx // 균일: 다음 정지 앵커
    lastTsRef.current = performance.now()

    const step = (ts: number): void => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05)
      lastTsRef.current = ts
      const preview = paceRef.current === 'preview'
      const stopsArr = stopsRef.current
      const ch = contentH() // 프레임당 1회만 측정(레이아웃 thrash 방지)

      // 현재 대사(직전 매칭 앵커)의 슬로우 구간 — 두 모드 공통.
      // durMs = 채택 녹음본 길이(있으면) 또는 대사 길이 추정. 구간 = durMs×TL_PX_PER_SEC(좌측 블럭과 동일).
      let origin: GuideStop | null = null
      for (const s of stopsArr) {
        if (s.y > cyRef.current + 0.5) break
        if (matches(s)) origin = s
      }
      const zoneH = origin ? Math.max(TL_MIN_PX, TL_PX_PER_SEC * (origin.durMs / 1000)) : 0
      const inZone = origin != null && cyRef.current - origin.y < zoneH
      // 슬로우 구간이면 읽기 속도(TL_PX_PER_SEC), 그 외 기본 속도. (배속 반영)
      const v = (inZone ? TL_PX_PER_SEC : GUIDE_SPEED) * speedRef.current

      if (preview) {
        // 연속 재생 + 슬로우 구간 동안만 자막(말풍선).
        const caption = inZone && origin ? origin.lineId : null
        if (caption !== captionRef.current) {
          captionRef.current = caption
          setStoppedLineId(caption)
        }
        cyRef.current = Math.min(cyRef.current + v * dt, ch)
        applyPos()
        if (cyRef.current >= ch - 0.5) {
          setAtEnd(true)
          setPlaying(false)
          return
        }
        rafRef.current = requestAnimationFrame(step)
        return
      }

      // 녹음모드: 동일한 슬로우 구간 속도로 다음 앵커까지, 닿으면 정지(수동 다음).
      const hasStop = nextStopRef.current < stopsArr.length
      const target = hasStop ? stopsArr[nextStopRef.current].y : ch
      cyRef.current = Math.min(cyRef.current + v * dt, target)
      applyPos()
      if (cyRef.current >= target - 0.5) {
        cyRef.current = target
        applyPos()
        if (hasStop) {
          const stop = stopsArr[nextStopRef.current]
          setStoppedLineId(stop.lineId)
          if (stop.mine) onSelect(stop.lineId)
        } else {
          setAtEnd(true)
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
      setStripW(stripRef.current?.offsetWidth ?? 0)
      cyRef.current = Math.min(cyRef.current, contentH())
      applyPos()
    })
    ro.observe(vp)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const play = (): void => {
    captionRef.current = null
    setAtEnd(false)
    setStoppedLineId(null)
    setPlaying(true)
  }
  // 처음으로 — 맨 위로 되돌린 뒤 재생.
  const restart = (): void => {
    cyRef.current = 0
    applyPos()
    play()
  }
  const togglePlaying = (): void => {
    if (playing) setPlaying(false)
    else if (atEnd) restart()
    else play()
  }
  const onWheel = (e: React.WheelEvent): void => {
    if (playing) setPlaying(false)
    if (atEnd) setAtEnd(false)
    cyRef.current = Math.max(0, Math.min(cyRef.current + e.deltaY, contentH()))
    applyPos()
    // 미리보기에서 수동 스크롤 시 자동 자막(말풍선)이 엉뚱한 위치에 남지 않도록 정리.
    if (paceRef.current === 'preview' && captionRef.current != null) {
      captionRef.current = null
      setStoppedLineId(null)
    }
  }

  // 특정 대사로 이동 — 그 앵커를 읽는 위치로 잡고 멈춤 + 선택.
  const goToLine = (lineId: number): void => {
    computeStops()
    const stop = stopsRef.current.find((s) => s.lineId === lineId)
    let cy: number
    if (stop) {
      cy = stop.y
    } else {
      // 앵커 없는 라인은 그 컷 상단으로.
      const cut = cuts.find((c) => c.lines.some((l) => l.id === lineId))
      const el = cut ? cutWrapRefs.current.get(cut.id) : null
      cy = el ? el.offsetTop : cyRef.current
    }
    setPlaying(false)
    setAtEnd(false)
    captionRef.current = lineId
    cyRef.current = Math.max(0, Math.min(cy, contentH()))
    applyPos()
    setStoppedLineId(lineId)
    const cid = lineById.get(lineId)?.characterId
    if (cid != null && myCharIds.has(cid)) onSelect(lineId)
  }

  // 자막 대사가 바뀌면: 왼쪽 패널 가운데로 스크롤 + 말풍선을 현재 읽는 위치(플레이헤드)에 맞춘다.
  useLayoutEffect(() => {
    panelActiveRef.current?.scrollIntoView({ block: 'nearest' })
    if (bubbleRef.current) bubbleRef.current.style.top = `${screenYRef.current}px`
  }, [stoppedLineId])

  const stoppedLine = stoppedLineId != null ? lineById.get(stoppedLineId) : null
  const stoppedChar = stoppedLine ? charById.get(stoppedLine.characterId) : undefined
  const stoppedMine = stoppedLine ? myCharIds.has(stoppedLine.characterId) : false
  const stoppedDur = stoppedLine
    ? lineDurationMs(stoppedLine, lineStates[stoppedLine.id]?.takes)
    : null

  return (
    <div className="rec-guide">
      {/* 왼쪽 sticky 대사 목록 — 클릭 시 해당 앵커로 이동 */}
      <aside className="rec-guide__panel">
        <div className="rec-guide__panel-head">
          <span>대사 목록</span>
          <div className="rec-guide__panel-filter">
            <button
              type="button"
              className={`rec-gfbtn${lineFilter === 'mine' ? ' rec-gfbtn--on' : ''}`}
              onClick={() => changeFilter('mine')}
            >
              내 대사
            </button>
            <button
              type="button"
              className={`rec-gfbtn${lineFilter === 'all' ? ' rec-gfbtn--on' : ''}`}
              onClick={() => changeFilter('all')}
            >
              전체
            </button>
          </div>
        </div>
        <div className="rec-guide__panel-list">
          {cuts.map((c) => {
            const visible =
              lineFilter === 'mine' ? c.lines.filter((l) => myCharIds.has(l.characterId)) : c.lines
            if (visible.length === 0) return null
            return (
              <div key={c.id} className="rec-guide__panel-cut">
                <div className="rec-guide__panel-cuthead">컷 {c.position}</div>
                {visible.map((line) => {
                  const ch = charById.get(line.characterId)
                  const mine = myCharIds.has(line.characterId)
                  const on = stoppedLineId === line.id
                  return (
                    <button
                      key={line.id}
                      ref={on ? panelActiveRef : undefined}
                      type="button"
                      className={`rec-plitem${on ? ' rec-plitem--on' : ''}${mine ? '' : ' rec-plitem--other'}`}
                      onClick={() => goToLine(line.id)}
                      title={line.text}
                    >
                      <span className="rec-plitem__dot" style={{ background: ch?.color }} />
                      <span className="rec-plitem__body">
                        <span className="rec-plitem__name">
                          <span className="rec-plitem__nametext" style={{ color: ch?.color }}>
                            {ch?.name ?? '?'}
                          </span>
                          {!mine && <span className="rec-plitem__rel">상대역</span>}
                        </span>
                        <span className="rec-plitem__text">{line.text}</span>
                      </span>
                      {mine && (
                        <span className={`rec-recst rec-recst--${recStatus(line.id)}`}>
                          {REC_ST_LABEL[recStatus(line.id)]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {lineFilter === 'mine' &&
            !cuts.some((c) => c.lines.some((l) => myCharIds.has(l.characterId))) && (
              <div className="rec-guide__panel-empty">내 대사가 없습니다.</div>
            )}
        </div>
      </aside>

      <div className="rec-guide__viewport" ref={viewportRef} onWheel={onWheel}>
        <div className="rec-guide__strip" ref={stripRef}>
          {/* 컷 바로 왼쪽: 녹음 길이 기반 세로 타임라인(블럭). 스트립 안에 있어 함께 스크롤. */}
          <div className="rec-tl" aria-hidden>
            {timeline.map((b) => (
              <button
                key={b.lineId}
                type="button"
                className={`rec-tlblock${b.lineId === stoppedLineId ? ' rec-tlblock--on' : ''}${b.mine ? '' : ' rec-tlblock--other'}`}
                style={{
                  top: `${b.top}px`,
                  height: `${b.height}px`,
                  background: b.color
                }}
                title={`${fmtDuration(b.durMs)}${b.estimated ? ' (추정)' : ''}`}
                onClick={() => goToLine(b.lineId)}
              />
            ))}
          </div>
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
                activeLineId={stoppedLineId}
                onSelect={goToLine}
                selectableAll
              />
            </div>
          ))}
        </div>

        {/* 읽는 줄(플레이헤드) — 시작엔 상단, 진행하며 40%로 내려와 고정, 끝에선 하단으로 */}
        <div className="rec-guide__playhead" ref={playheadRef} />

        {/* 대사 말풍선 — 균일은 정지 시, 미리보기는 재생 중 자막처럼. 위치는 플레이헤드 추종(imperative). */}
        {stoppedLine && (
          <div className="rec-bubble" ref={bubbleRef}>
            <div className="rec-bubble__head">
              <span className="rec-line__speaker" style={{ color: stoppedChar?.color }}>
                <span className="rec-line__dot" style={{ background: stoppedChar?.color }} />
                {stoppedChar?.name ?? '?'}
              </span>
              {!stoppedMine && <span className="rec-line__tag">상대역</span>}
              {stoppedDur && (
                <span
                  className="rec-bubble__dur"
                  title={stoppedDur.estimated ? '기본 duration 추정(mock)' : '녹음본 길이'}
                >
                  {stoppedDur.estimated ? '≈ ' : '🎙 '}
                  {fmtDuration(stoppedDur.ms)}
                </span>
              )}
            </div>
            <p className="rec-bubble__text">{stoppedLine.text}</p>
            {/* 녹음모드에서만 녹음 컨트롤 + 다음. 미리보기는 자막만(연속 재생). */}
            {pace === 'fixed' ? (
              <>
                {stoppedMine && (
                  <RecorderControls
                    takes={lineStates[stoppedLine.id]?.takes ?? []}
                    recordable={recordable}
                    isRecording={isRecording && activeLineId === stoppedLine.id}
                    elapsedMs={elapsedMs}
                    pending={
                      pendingTake && pendingTake.lineId === stoppedLine.id ? pendingTake.take : null
                    }
                    playingTakeId={playingTakeId}
                    onStart={() => onRecord(stoppedLine.id)}
                    onStop={onStop}
                    onSave={onSave}
                    onReRecord={onReRecord}
                    onCancel={onCancel}
                    onPlay={onPlay}
                    onSelectTake={(tid) => onSelectTake(stoppedLine.id, tid)}
                    onDeleteTake={(tid) => onDeleteTake(stoppedLine.id, tid)}
                  />
                )}
                {/* 녹음 중·미저장 take 가 있으면 실수로 넘어가지 않게 '다음' 숨김. */}
                {!(
                  (isRecording && activeLineId === stoppedLine.id) ||
                  pendingTake?.lineId === stoppedLine.id
                ) && (
                  <button type="button" className="rec-bubble__next" onClick={play}>
                    다음 ▶
                  </button>
                )}
              </>
            ) : (
              playing && <span className="rec-bubble__playing">▷ 재생 중…</span>
            )}
          </div>
        )}

        {/* 재생/일시정지 + 페이싱 + 배속 */}
        <div className="rec-guide__ctrl">
          <button type="button" className="rec-btn rec-btn--primary" onClick={togglePlaying}>
            {playing ? '❚❚ 일시정지' : atEnd ? '↺ 처음으로' : '▶ 재생'}
          </button>
          <div
            className="rec-guide__speed"
            title="미리보기는 대사 길이에 맞춰 연속 재생, 녹음모드는 앵커마다 멈춰 녹음"
          >
            <button
              type="button"
              className={`rec-spbtn${pace === 'preview' ? ' rec-spbtn--on' : ''}`}
              onClick={() => changePace('preview')}
            >
              🎬 미리보기
            </button>
            <button
              type="button"
              className={`rec-spbtn${pace === 'fixed' ? ' rec-spbtn--on' : ''}`}
              onClick={() => changePace('fixed')}
            >
              🎙 녹음모드
            </button>
          </div>
          <div className="rec-guide__speed" title="배속">
            {GUIDE_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`rec-spbtn${speed === s ? ' rec-spbtn--on' : ''}`}
                onClick={() => changeSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
