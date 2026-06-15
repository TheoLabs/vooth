import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import sortBy from 'lodash/sortBy'
import { AnchorStage, anchorEven } from '../components/AnchorStage'
import {
  fetchDirectorEpisode,
  saveDirection,
  type DirectionPayload,
  type DirectorEpisodeDetail
} from '../api/directors'
import type { DirCut, DirEpisode } from '../types/direction'
import './DirectionEditorPage.css'

/** directors 상세 응답 → 에디터용 DirEpisode (캐릭터명 매핑, position 정렬). */
function toDirEpisode(detail: DirectorEpisodeDetail): DirEpisode {
  const nameById = new Map(detail.characters.map((c) => [c.id, c.name]))
  const cuts: DirCut[] = sortBy(detail.episode.cuts, 'position').map((c) => ({
    id: c.id,
    imageUrl: c.imageUrl,
    imageWidth: c.imageWidth ?? 0,
    imageHeight: c.imageHeight ?? 0,
    cropBox: c.cropBox ?? undefined,
    holdMs: c.holdMs ?? undefined,
    lines: sortBy(c.lines, 'position').map((l) => ({
      id: l.id,
      characterName: nameById.get(l.characterId) ?? `캐릭터 #${l.characterId}`,
      script: l.script,
      anchorY: l.anchorY ?? undefined,
      gapBeforeMs: l.gapBeforeMs ?? undefined
    }))
  }))
  return {
    id: detail.episode.id,
    contentTitle: detail.contentTitle,
    chapter: detail.episode.chapter,
    title: detail.episode.title,
    cuts
  }
}

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
  const [episode, setEpisode] = useState<DirEpisode | undefined>(undefined)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['director-episode', id],
    queryFn: () => fetchDirectorEpisode(id as string),
    enabled: Boolean(id),
    retry: false
  })
  useEffect(() => {
    if (data) setEpisode(toDirEpisode(data))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload: DirectionPayload) => saveDirection(id as string, payload)
  })

  const handleSave = (): void => {
    if (!episode) return
    const payload: DirectionPayload = {
      cuts: episode.cuts.map((c) => ({
        id: c.id,
        holdMs: c.holdMs,
        lines: c.lines.map((l) => ({ id: l.id, anchorY: l.anchorY, gapBeforeMs: l.gapBeforeMs }))
      }))
    }
    saveMutation.mutate(payload)
  }

  const mapCut = (cutId: number, fn: (cut: DirCut) => DirCut): void =>
    setEpisode((prev) =>
      prev ? { ...prev, cuts: prev.cuts.map((c) => (c.id === cutId ? fn(c) : c)) } : prev
    )

  const setAnchorY = (cutId: number, lineId: number, y: number): void =>
    mapCut(cutId, (c) => ({ ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, anchorY: y } : l)) }))
  const setGap = (cutId: number, lineId: number, ms: number | undefined): void =>
    mapCut(cutId, (c) => ({ ...c, lines: c.lines.map((l) => (l.id === lineId ? { ...l, gapBeforeMs: ms } : l)) }))
  const setHold = (cutId: number, ms: number | undefined): void => mapCut(cutId, (c) => ({ ...c, holdMs: ms }))

  if (isLoading && !episode) {
    return (
      <div className="de-empty">
        <p>불러오는 중…</p>
      </div>
    )
  }

  if (isError || !episode) {
    return (
      <div className="de-empty">
        <p>회차를 불러오지 못했습니다.{isError ? ` ${(error as Error)?.message}` : ''}</p>
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
          <button
            type="button"
            className="de__save de__save--active"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </header>

      {saveMutation.isError && (
        <p className="de__note de__note--err">저장 실패: {(saveMutation.error as Error)?.message}</p>
      )}
      {saveMutation.isSuccess && !saveMutation.isPending && (
        <p className="de__note de__note--ok">연출이 저장되었습니다.</p>
      )}

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
    </div>
  )
}
