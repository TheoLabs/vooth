import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnchorStage, anchorEven } from '../components/AnchorStage'
import { ScrollPreview } from '../components/ScrollPreview'
import { getMockDirEpisode } from '../mocks/direction.mock'
import type { DirCut, DirEpisode } from '../types/direction'
import type { ScrollInputCut } from '../lib/scrollTimeline'
import './DirectionEditorPage.css'

function NumMs({
  value,
  onChange,
  placeholder
}: {
  value?: number
  onChange: (v: number | undefined) => void
  placeholder?: string
}): React.JSX.Element {
  return (
    <span className="de-ms">
      <input
        type="number"
        min={0}
        step={100}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
      <em>ms</em>
    </span>
  )
}

function CutDirector({
  cut,
  index,
  setAnchorY,
  setGap,
  setHold
}: {
  cut: DirCut
  index: number
  setAnchorY: (lineId: number, y: number) => void
  setGap: (lineId: number, ms: number | undefined) => void
  setHold: (ms: number | undefined) => void
}): React.JSX.Element {
  return (
    <section className="de-cut">
      <div className="de-cut__stage">
        <AnchorStage
          imageUrl={cut.imageUrl}
          lines={cut.lines.map((l) => ({ id: l.id, anchorY: l.anchorY }))}
          onChange={setAnchorY}
        />
      </div>

      <div className="de-cut__body">
        <div className="de-cut__head">
          <span className="de-cut__no">컷 {index + 1}</span>
          <span className="de-cut__hold">
            머무름 <NumMs value={cut.holdMs} onChange={setHold} placeholder="0" />
          </span>
        </div>

        <ul className="de-lines">
          {cut.lines.map((line, i) => {
            const y = line.anchorY ?? anchorEven(i, cut.lines.length)
            return (
              <li className="de-line" key={line.id}>
                <span className="de-line__no">{i + 1}</span>
                <div className="de-line__main">
                  <div className="de-line__text">
                    <span className="de-line__char">{line.characterName}</span>
                    <span className="de-line__script">{line.script}</span>
                  </div>
                  <div className="de-line__meta">
                    <span className="de-line__anchor">위치 {Math.round(y * 100)}%</span>
                    <span className="de-line__gap">
                      앞 간격 <NumMs value={line.gapBeforeMs} onChange={(v) => setGap(line.id, v)} placeholder="0" />
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function DirectionEditorPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [episode, setEpisode] = useState<DirEpisode | undefined>(() => getMockDirEpisode(Number(id)))
  const [previewOpen, setPreviewOpen] = useState(false)

  const mapCut = (cutId: number, fn: (cut: DirCut) => DirCut): void =>
    setEpisode((prev) =>
      prev ? { ...prev, cuts: prev.cuts.map((c) => (c.id === cutId ? fn(c) : c)) } : prev
    )

  const setAnchorY = (cutId: number, lineId: number, y: number): void =>
    mapCut(cutId, (c) => ({ ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, anchorY: y } : l)) }))
  const setGap = (cutId: number, lineId: number, ms: number | undefined): void =>
    mapCut(cutId, (c) => ({ ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, gapBeforeMs: ms } : l)) }))
  const setHold = (cutId: number, ms: number | undefined): void => mapCut(cutId, (c) => ({ ...c, holdMs: ms }))

  const previewCuts = useMemo<ScrollInputCut[]>(
    () =>
      (episode?.cuts ?? []).map((c) => ({
        imageUrl: c.imageUrl,
        imageWidth: c.imageWidth,
        imageHeight: c.imageHeight,
        holdMs: c.holdMs,
        lines: c.lines.map((l) => ({
          id: l.id,
          script: l.script,
          characterName: l.characterName,
          anchorY: l.anchorY,
          gapBeforeMs: l.gapBeforeMs
        }))
      })),
    [episode]
  )

  if (!episode) {
    return (
      <div className="de-empty">
        <p>회차를 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/')}>
          목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="de">
      <header className="de__header">
        <button type="button" className="de__back" onClick={() => navigate('/')}>
          ← 회차 목록
        </button>
        <div className="de__titles">
          <span className="de__content">{episode.contentTitle}</span>
          <h2 className="de__title">
            <span className="de__chapter">{episode.chapter}화</span>
            {episode.title}
          </h2>
        </div>
        <div className="de__actions">
          <button type="button" className="de__preview" onClick={() => setPreviewOpen(true)}>
            ▶ 연속 스크롤 미리보기
          </button>
          <button type="button" className="de__save" disabled title="연출 저장 엔드포인트 연동 예정">
            저장(준비 중)
          </button>
        </div>
      </header>

      <p className="de__note">
        ⚠️ mock — 컷/대사는 back-office 등록 데이터를 대신한 샘플. 연출(위치·간격·머무름)은 로컬 편집이며 저장 API는 추후
        연동.
      </p>

      <div className="de__cuts">
        {episode.cuts.map((cut, i) => (
          <CutDirector
            key={cut.id}
            cut={cut}
            index={i}
            setAnchorY={(lineId, y) => setAnchorY(cut.id, lineId, y)}
            setGap={(lineId, ms) => setGap(cut.id, lineId, ms)}
            setHold={(ms) => setHold(cut.id, ms)}
          />
        ))}
      </div>

      {previewOpen && <ScrollPreview cuts={previewCuts} onClose={() => setPreviewOpen(false)} />}
    </div>
  )
}
