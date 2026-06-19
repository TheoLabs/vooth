import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEpisodeDetail } from '../domain/mockData'
import {
  CUT_TRANSITION_LABEL,
  CutTransition,
  EPISODE_STATUS_LABEL,
  type Cut,
  type EpisodeDetail
} from '../domain/types'
import { Badge } from '../components/Badge'
import { MockNote } from '../components/MockNote'
import { CropAnchorView } from '../components/CropAnchorView'
import { TimelineStrip } from '../components/TimelineStrip'
import { EPISODE_STATUS_BADGE, formatGap } from '../domain/format'
import './tool.css'
import './editor.css'

/**
 * 연출 에디터(핵심). 한 회차의 컷·라인 연출값을 편집한다.
 * - 컷: cropBox/anchorY 시각화 + holdMs + transition
 * - 라인: 화자·대사(read-only) + gapBeforeMs(음수=겹침)
 * - 타임라인 strip 시각화
 * 편집은 로컬 state(mock). 저장 시 directors/* PUT 으로 변경분만 전송 예정.
 */
export function EpisodeEditorPage(): React.JSX.Element {
  const { episodeId } = useParams()
  const navigate = useNavigate()
  const id = Number(episodeId)

  // mock 상세를 로컬 편집 state 로 복제.
  const initial = useMemo<EpisodeDetail>(() => getEpisodeDetail(id), [id])
  const [cuts, setCuts] = useState<Cut[]>(() => initial.cuts.map((c) => ({ ...c, lines: c.lines.map((l) => ({ ...l })) })))
  const [dirty, setDirty] = useState(false)

  const charById = useMemo(() => {
    const m = new Map(initial.characters.map((c) => [c.id, c]))
    return m
  }, [initial.characters])

  const characterColor = (cid: number): string => charById.get(cid)?.color ?? '#94a3b8'

  const updateCut = (cutId: number, patch: Partial<Cut>): void => {
    setCuts((prev) => prev.map((c) => (c.id === cutId ? { ...c, ...patch } : c)))
    setDirty(true)
  }
  const updateLineGap = (cutId: number, lineId: number, gap: number): void => {
    setCuts((prev) =>
      prev.map((c) =>
        c.id !== cutId
          ? c
          : { ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, gapBeforeMs: gap } : l)) }
      )
    )
    setDirty(true)
  }
  const updateLineAnchor = (cutId: number, lineId: number, anchorY: number | null): void => {
    setCuts((prev) =>
      prev.map((c) =>
        c.id !== cutId
          ? c
          : { ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, anchorY } : l)) }
      )
    )
    setDirty(true)
  }

  const badge = EPISODE_STATUS_BADGE[initial.status]

  return (
    <div className="tool-page">
      <div>
        <button className="ed-back" onClick={() => navigate('/episodes')}>
          ← 작업 목록
        </button>
        <div className="tool-page__head">
          <div>
            <h2 className="tool-page__title">
              {initial.contentTitle} · {initial.episodeNo}화{' '}
              <span style={{ color: '#64748b', fontWeight: 600 }}>{initial.title}</span>
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <Badge label={EPISODE_STATUS_LABEL[initial.status]} {...badge} />
              <span className="tool-page__desc">
                컷 {cuts.length} · 대사 {cuts.reduce((n, c) => n + c.lines.length, 0)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MockNote />
            <button
              className="tool-btn"
              onClick={() => navigate(`/episodes/${id}/adopt`)}
              title="채택 화면"
            >
              채택
            </button>
            <button className="tool-btn" onClick={() => navigate(`/episodes/${id}/preview`)}>
              미리보기
            </button>
            <button
              className="tool-btn tool-btn--primary"
              disabled={!dirty}
              onClick={() => {
                // mock: 실제로는 변경분만 directors PUT.
                setDirty(false)
                window.alert('연출값 저장(mock). 실제로는 변경된 컷/라인만 directors/* PUT 전송.')
              }}
            >
              {dirty ? '연출 저장' : '저장됨'}
            </button>
          </div>
        </div>
      </div>

      {/* 타임라인 strip */}
      <div className="tool-card">
        <strong style={{ fontSize: 13 }}>타임라인</strong>
        <div style={{ marginTop: 10 }}>
          <TimelineStrip cuts={cuts} characterColor={characterColor} />
        </div>
      </div>

      {/* 컷 리스트 */}
      {cuts.length === 0 && (
        <div className="tool-card" style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
          등록된 컷이 없습니다. (컷·대사 등록은 back-office)
        </div>
      )}

      {[...cuts]
        .sort((a, b) => a.position - b.position)
        .map((cut) => (
          <div key={cut.id} className="tool-card ed-cut">
            <div className="ed-cut__media">
              <CropAnchorView
                imageUrl={cut.imageUrl}
                cropBox={cut.cropBox}
                anchors={cut.lines.map((l) => ({
                  id: l.id,
                  anchorY: l.anchorY,
                  color: characterColor(l.characterId)
                }))}
              />
            </div>

            <div className="ed-cut__body">
              <div className="ed-cut__head">
                <span className="ed-cut__no">{cut.position}</span>
                <strong>컷 {cut.position}</strong>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  {cut.imageWidth}×{cut.imageHeight}
                </span>
              </div>

              {/* 컷 연출 컨트롤: holdMs, transition */}
              <div className="ed-cut__controls">
                <div className="tool-field">
                  <span className="tool-field__label">hold (ms) — 마지막 대사 뒤 머무름</span>
                  <input
                    type="number"
                    className="tool-input"
                    style={{ width: 130 }}
                    value={cut.holdMs}
                    min={0}
                    step={100}
                    onChange={(e) => updateCut(cut.id, { holdMs: Number(e.target.value) })}
                  />
                </div>
                <div className="tool-field">
                  <span className="tool-field__label">transition (전환)</span>
                  <select
                    className="tool-select"
                    style={{ width: 130 }}
                    value={cut.transition}
                    onChange={(e) =>
                      updateCut(cut.id, { transition: e.target.value as CutTransition })
                    }
                  >
                    {Object.values(CutTransition).map((t) => (
                      <option key={t} value={t}>
                        {CUT_TRANSITION_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 라인 리스트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...cut.lines]
                  .sort((a, b) => a.position - b.position)
                  .map((line) => {
                    const ch = charById.get(line.characterId)
                    return (
                      <div
                        key={line.id}
                        className={`ed-line${line.gapBeforeMs < 0 ? ' ed-line--overlap' : ''}`}
                      >
                        <div className="ed-line__char">
                          <span
                            className="ed-line__dot"
                            style={{ background: ch?.color ?? '#94a3b8' }}
                          />
                          {ch?.name ?? '미지정'}
                        </div>
                        <div className="ed-line__text">{line.text}</div>
                        <div className="ed-line__controls">
                          <div className="tool-field">
                            <span className="tool-field__label">gap (ms, 음수=겹침)</span>
                            <input
                              type="number"
                              className="tool-input"
                              style={{ width: 110 }}
                              value={line.gapBeforeMs}
                              step={50}
                              onChange={(e) =>
                                updateLineGap(cut.id, line.id, Number(e.target.value))
                              }
                            />
                            <span style={{ fontSize: 10, color: line.gapBeforeMs < 0 ? '#b91c1c' : '#94a3b8' }}>
                              {formatGap(line.gapBeforeMs)}
                            </span>
                          </div>
                          <div className="tool-field">
                            <span className="tool-field__label">anchorY (0~1)</span>
                            <input
                              type="number"
                              className="tool-input"
                              style={{ width: 100 }}
                              value={line.anchorY ?? ''}
                              min={0}
                              max={1}
                              step={0.05}
                              placeholder="균등"
                              onChange={(e) =>
                                updateLineAnchor(
                                  cut.id,
                                  line.id,
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {cut.lines.length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>대사 없음</div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
