import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EPISODE_STATUS_LABEL, EpisodeStatus } from '../domain/types'
import { Badge } from '../components/Badge'
import { EPISODE_STATUS_BADGE } from '../domain/format'
import { useChangeEpisodeStatus, useDirectorEpisode } from '../features/episode/useDirectorEpisodes'
import { useDirectorCuts } from '../features/cut/useDirectorCuts'
import { useSetLineAnchorY } from '../features/cut/useSetLineAnchorY'
import { useDirectorCharacters } from '../features/character/useDirectorCharacters'
import type { DirectorCut } from '../api/cut.api'
import './tool.css'
import './editor.css'
import './anchor.css'

/** 캐릭터 색 팔레트(디렉터 표면에 캐릭터 color 가 없어 characterId 순서로 부여). */
const CHAR_PALETTE = [
  '#6366f1',
  '#ec4899',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#a855f7',
  '#ef4444',
  '#14b8a6'
]

/** 앵커 편집용 컷/대사(연결·연출 필드는 제외한 슬림 모델). */
interface AnchorLine {
  id: number
  characterId: number
  text: string
  position: number
  anchorY: number | null
}
interface AnchorCut {
  id: number
  position: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  lines: AnchorLine[]
}

/** 컷 목록 응답 → 앵커 편집 모델. (cut.order→position, line.script→text, line.order→position) */
function mapCuts(items: DirectorCut[]): AnchorCut[] {
  return items.map((cut) => ({
    id: cut.id,
    position: cut.order,
    imageUrl: cut.imageUrl,
    imageWidth: cut.imageWidth,
    imageHeight: cut.imageHeight,
    lines: cut.lines.map((l) => ({
      id: l.id,
      characterId: l.characterId,
      text: l.script,
      position: l.order,
      anchorY: l.anchorY
    }))
  }))
}

/**
 * 대사 앵커(anchorY) 설정 — 독립 화면. (연출 에디터에서 분리됨)
 * 회차 메타·상태 + 컷/대사는 실 API. 캐릭터 이름/색은 디렉터 조회가 없어 생성 대체.
 * 컷 이미지를 크게 띄우고, 대사 앵커를 클릭·드래그해 발화 세로 위치(0~1)를 지정한다.
 * 편집은 로컬 state. 저장 시 POST /directors/episodes/:id/lines 로 명시 anchorY 라인을 일괄 전송한다.
 */
export function EpisodeAnchorPage(): React.JSX.Element {
  const { contentId, episodeId } = useParams()
  const navigate = useNavigate()
  const cid = Number(contentId)
  const id = Number(episodeId)

  // 회차 메타·상태(상세 조회) + 컷/대사(컷 목록 조회)를 실 API 로 가져온다.
  const { data: episode } = useDirectorEpisode(cid, id)
  const { data: cutData, isLoading: cutsLoading } = useDirectorCuts(id)

  // 컷/대사를 앵커 편집용 로컬 state 로 hydrate(회차별 최초 1회).
  const [cuts, setCuts] = useState<AnchorCut[]>([])
  const hydratedIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!cutData || hydratedIdRef.current === id) return
    hydratedIdRef.current = id
    setCuts(mapCuts(cutData.items))
  }, [cutData, id])

  const [dirty, setDirty] = useState(false)
  // 회차 상태: 실 API 값을 기본으로, 전이 중엔 낙관적 override.
  const [statusOverride, setStatusOverride] = useState<EpisodeStatus | null>(null)
  const status = statusOverride ?? episode?.status ?? EpisodeStatus.DRAFT

  const statusMutation = useChangeEpisodeStatus(cid, id)
  const changeStatus = (next: EpisodeStatus): void => {
    const prev = statusOverride
    setStatusOverride(next) // 낙관적 반영
    statusMutation.mutate(next, {
      onError: (err) => {
        setStatusOverride(prev)
        window.alert(`상태 변경에 실패했습니다.\n${err.message}`)
      }
    })
  }
  const promoteToReady = (): void => {
    const ok = window.confirm(
      '대사 앵커 작업을 마치고 ‘녹음 대기’ 상태로 전환할까요?\n이후 성우 녹음 단계로 넘어갑니다.'
    )
    if (!ok) return
    changeStatus(EpisodeStatus.READY)
  }
  const revertToDraft = (): void => changeStatus(EpisodeStatus.DRAFT)

  const orderedCuts = useMemo(() => [...cuts].sort((a, b) => a.position - b.position), [cuts])
  const [cutIdx, setCutIdx] = useState(0)
  const safeIdx = Math.min(cutIdx, orderedCuts.length - 1)
  const cut = orderedCuts[safeIdx] ?? null

  const lines = useMemo(
    () => (cut ? [...cut.lines].sort((a, b) => a.position - b.position) : []),
    [cut]
  )
  const [activeLineId, setActiveLineId] = useState<number | null>(null)

  // 캐릭터 이름은 실 API. color 는 디렉터 표면에 없어 순서대로 팔레트를 부여.
  const { data: charData } = useDirectorCharacters(cid)
  const charById = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>()
    ;[...(charData?.items ?? [])]
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
      .forEach((c, i) => {
        m.set(c.id, { name: c.name, color: CHAR_PALETTE[i % CHAR_PALETTE.length] })
      })
    return m
  }, [charData])
  const charColor = (charId: number): string => charById.get(charId)?.color ?? '#94a3b8'
  const charName = (charId: number): string => charById.get(charId)?.name ?? `캐릭터 ${charId}`

  const stageRef = useRef<HTMLDivElement>(null)
  // 드래그 중인 라인 id(없으면 null). 핸들 mousedown 으로 시작, 스테이지에서 위아래 드래그.
  const dragLineRef = useRef<number | null>(null)

  const setAnchorY = (lineId: number, anchorY: number | null): void => {
    if (!cut) return
    setCuts((prev) =>
      prev.map((c) =>
        c.id !== cut.id
          ? c
          : { ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, anchorY } : l)) }
      )
    )
    setDirty(true)
  }

  const anchorYFromClientY = (clientY: number): number => {
    const el = stageRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const y = (clientY - rect.top) / rect.height
    return Math.min(1, Math.max(0, Math.round(y * 100) / 100))
  }

  // 핸들 클릭 = 선택, 위아래 드래그 = anchorY 수정.
  const onHandleDown = (e: React.MouseEvent, lineId: number): void => {
    e.stopPropagation()
    e.preventDefault()
    setActiveLineId(lineId)
    dragLineRef.current = lineId
  }
  const onStageMove = (e: React.MouseEvent): void => {
    const id = dragLineRef.current
    if (id == null) return
    setAnchorY(id, anchorYFromClientY(e.clientY))
  }
  const endDrag = (): void => {
    dragLineRef.current = null
  }

  const gotoCut = (idx: number): void => {
    setCutIdx(idx)
    setActiveLineId(null)
  }

  // 컷 번호 직접 입력 → 해당 컷으로 점프(컷이 많을 때).
  // draft=편집 중 값(없으면 현재 컷 번호 표시). commit 시 점프 후 draft 해제.
  const [cutDraft, setCutDraft] = useState<string | null>(null)
  const cutInputValue = cutDraft ?? (cut ? String(cut.position) : '')
  const commitCutJump = (): void => {
    if (cutDraft != null) {
      const idx = orderedCuts.findIndex((c) => c.position === Number(cutDraft))
      if (idx >= 0) gotoCut(idx)
    }
    setCutDraft(null)
  }

  // 저장: 명시 anchorY(균등=null 제외) 라인만 모아 일괄 전송. (API 가 number 만 받음)
  const setAnchorMutation = useSetLineAnchorY(id)
  const saveAnchors = (): void => {
    const anchorYItems = cuts.flatMap((c) =>
      c.lines
        .filter((l) => l.anchorY != null)
        .map((l) => ({ cutId: c.id, lineId: l.id, anchorY: l.anchorY as number }))
    )
    setAnchorMutation.mutate(anchorYItems, {
      onSuccess: () => {
        setDirty(false)
        window.alert('대사 앵커를 저장했습니다.')
      },
      onError: (err) => {
        window.alert(`저장에 실패했습니다.\n${err.message}`)
      }
    })
  }

  return (
    <div className="tool-page anc-page">
      <div>
        <button className="ed-back" onClick={() => navigate(`/anchors/contents/${cid}`)}>
          ← 작품 상세
        </button>
        <div className="tool-page__head">
          <div>
            <h2 className="tool-page__title">대사 앵커 설정</h2>
            <p className="tool-page__desc">
              {episode ? `${episode.chapter}화 · ${episode.title}` : '회차'} — 컷 위의 대사 앵커를
              클릭해 선택하고 드래그해 발화 세로 위치를 지정합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="tool-btn tool-btn--primary"
              disabled={!dirty || setAnchorMutation.isPending}
              onClick={saveAnchors}
            >
              {setAnchorMutation.isPending ? '저장 중…' : dirty ? '앵커 저장' : '저장됨'}
            </button>
          </div>
        </div>

        {/* 상태 바: 앵커 작업 완료 → 녹음 대기 전환 */}
        <div className="anc-status">
          <div className="anc-status__now">
            <span className="anc-status__label">회차 상태</span>
            <Badge label={EPISODE_STATUS_LABEL[status]} {...EPISODE_STATUS_BADGE[status]} />
          </div>
          {status === EpisodeStatus.DRAFT ? (
            <div className="anc-status__action">
              <span className="anc-status__hint">앵커 설정을 마쳤다면 녹음 단계로 넘기세요.</span>
              <button
                className="tool-btn tool-btn--primary"
                onClick={promoteToReady}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? '변경 중…' : '녹음 대기로 전환 →'}
              </button>
            </div>
          ) : status === EpisodeStatus.READY ? (
            <div className="anc-status__action">
              <span className="anc-status__hint anc-status__hint--ok">
                ✓ 녹음 대기 상태입니다. 녹음 후 연출 단계로 진행됩니다.
              </span>
              <button
                className="tool-btn tool-btn--sm tool-btn--ghost"
                onClick={revertToDraft}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? '변경 중…' : '초안으로 되돌리기'}
              </button>
            </div>
          ) : (
            <span className="anc-status__hint">
              이미 녹음 이후 단계라 앵커 단계에서 상태를 바꿀 수 없습니다.
            </span>
          )}
        </div>
      </div>

      {cut ? (
        <div className="anc-wrap">
          {/* 인터랙티브 스테이지 */}
          <div className="anc-stage-col">
            <div className="anc-cutnav">
              <button
                className="tool-btn tool-btn--sm"
                disabled={cutIdx <= 0}
                onClick={() => gotoCut(cutIdx - 1)}
              >
                ← 이전 컷
              </button>
              <span className="anc-cutnav__pos">
                컷{' '}
                <input
                  className="anc-cutnav__input"
                  inputMode="numeric"
                  value={cutInputValue}
                  onChange={(e) => setCutDraft(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  onBlur={commitCutJump}
                />
                <span style={{ color: 'var(--vt-text-dim)' }}>/ {orderedCuts.length}</span>
              </span>
              <button
                className="tool-btn tool-btn--sm"
                disabled={cutIdx >= orderedCuts.length - 1}
                onClick={() => gotoCut(cutIdx + 1)}
              >
                다음 컷 →
              </button>
            </div>

            {/* 코버플로우 캐러셀: 모든 컷을 같은 element 로 렌더(전환 유지).
                옆 컷은 뒤(translateZ-)·기울어져 어둡게, 이동하면 깊이축으로 앞으로 나온다.
                가로폭(--anc-w)·뷰포트 높이 모두 고정 → 컷을 바꿔도 레이아웃이 흔들리지 않는다.
                원본 가로가 같은 컷은 항상 같은 가로폭으로 보이고, 세로가 길면 컷 안에서 스크롤. */}
            <div className="anc-viewport">
              {orderedCuts.map((c, i) => {
                const off = i - safeIdx
                const abs = Math.abs(off)
                // 가상화: 활성 컷 주변 window(±3)만 렌더 → 컷이 100개여도 DOM/이미지는 ~7장.
                // (±2 까지만 보이고 ±3 은 opacity 0 으로 대기 → 이동 시 자연스럽게 슬라이드 인)
                if (abs > 3) return null
                const isActive = off === 0
                const visible = abs <= 2
                const sign = Math.sign(off)
                const tx = abs === 0 ? 0 : sign * (58 + (abs - 1) * 34)
                const tz = abs === 0 ? 0 : -(200 + (abs - 1) * 180)
                const ry = abs === 0 ? 0 : -sign * (22 + (abs - 1) * 8)
                const slideStyle: React.CSSProperties = {
                  transform: `translateX(calc(-50% + ${tx}%)) translateZ(${tz}px) rotateY(${ry}deg)`,
                  opacity: visible ? 1 : 0,
                  zIndex: 10 - abs,
                  pointerEvents: visible ? undefined : 'none'
                }

                return (
                  <div
                    key={c.id}
                    className={`anc-slide ${isActive ? 'anc-slide--active' : 'anc-slide--side'}`}
                    style={slideStyle}
                    onClick={isActive ? undefined : () => gotoCut(i)}
                    onMouseMove={isActive ? onStageMove : undefined}
                    onMouseUp={isActive ? endDrag : undefined}
                    onMouseLeave={isActive ? endDrag : undefined}
                    title={isActive ? undefined : `컷 ${c.position}`}
                  >
                    {/* 캔버스 = 이미지 원본 비율 영역. 슬라이드(고정 높이)보다 길면 활성 슬라이드
                        내부에서 세로 스크롤된다. 앵커 핸들은 캔버스(=이미지 전체 높이) 기준이라
                        스크롤해도 anchorY(0~1) 계산이 정확하다. */}
                    <div className="anc-canvas" ref={isActive ? stageRef : undefined}>
                      <img
                        src={c.imageUrl}
                        alt={isActive ? `컷 ${c.position}` : ''}
                        draggable={false}
                        loading={isActive ? undefined : 'lazy'}
                      />
                      {/* 대사 앵커 핸들 — 클릭 선택, 위아래 드래그로 anchorY 수정. */}
                      {isActive &&
                        lines.map((l, idx) => {
                          const isNull = l.anchorY == null
                          // 균등(null) 라인은 균등 분포 위치에 점선 고스트로 표시 → 드래그하면 명시값.
                          const y = isNull ? (idx + 1) / (lines.length + 1) : (l.anchorY as number)
                          const active = l.id === activeLineId
                          return (
                            <div
                              key={l.id}
                              className={`anc-handle${active ? ' anc-handle--active' : ''}${
                                isNull ? ' anc-handle--ghost' : ''
                              }`}
                              style={{ top: `${y * 100}%`, color: charColor(l.characterId) }}
                              onMouseDown={(e) => onHandleDown(e, l.id)}
                              title={`L${idx + 1} ${charName(l.characterId)} · ${
                                isNull ? '균등(기본)' : (l.anchorY as number).toFixed(2)
                              }`}
                            >
                              <span className="anc-handle__line" />
                              <span className="anc-handle__label">
                                L{idx + 1}
                                {isNull ? ' · 균등' : ''}
                              </span>
                              <span className="anc-handle__dot" />
                            </div>
                          )
                        })}
                    </div>
                    {!isActive && <span className="anc-peek__no">컷 {c.position}</span>}
                  </div>
                )
              })}
            </div>
            <div className="anc-stage__hint">
              컷 위의 앵커를 <strong>클릭</strong>해 선택하고 <strong>위아래로 드래그</strong>해
              발화 위치를 조절하세요. 점선 = 균등(기본). 양옆 흐린 컷을 누르면 이동합니다.
            </div>
          </div>

          {/* 대사 목록 */}
          <div className="anc-side">
            <div className="anc-side__title">대사 ({lines.length})</div>
            <div className="anc-lines">
              {lines.map((line, i) => {
                const active = line.id === activeLineId
                return (
                  <button
                    key={line.id}
                    type="button"
                    className={`anc-line${active ? ' anc-line--active' : ''}`}
                    onClick={() => setActiveLineId(line.id)}
                  >
                    <div className="anc-line__head">
                      <span className="anc-line__idx">L{i + 1}</span>
                      <span className="anc-line__char">
                        <span
                          className="ed-line__dot"
                          style={{ background: charColor(line.characterId) }}
                        />
                        {charName(line.characterId)}
                      </span>
                      <span
                        className={`anc-line__val${line.anchorY == null ? ' anc-line__val--none' : ''}`}
                      >
                        {line.anchorY == null ? '균등' : line.anchorY.toFixed(2)}
                      </span>
                    </div>
                    <div className="anc-line__text">{line.text}</div>
                    {active && (
                      <div className="anc-line__edit" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          className="tool-input tool-input--sm"
                          style={{ width: 90 }}
                          min={0}
                          max={1}
                          step={0.05}
                          placeholder="균등"
                          value={line.anchorY ?? ''}
                          onChange={(e) =>
                            setAnchorY(
                              line.id,
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                        />
                        <button
                          className="tool-btn tool-btn--sm tool-btn--ghost"
                          onClick={() => setAnchorY(line.id, null)}
                        >
                          균등으로
                        </button>
                      </div>
                    )}
                  </button>
                )
              })}
              {lines.length === 0 && <div className="ed-fx-empty">대사 없음</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="tool-card ed-empty">
          {cutsLoading ? '컷을 불러오는 중…' : '등록된 컷이 없습니다. (컷·대사 등록은 back-office)'}
        </div>
      )}
    </div>
  )
}
