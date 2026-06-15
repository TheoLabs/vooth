import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import sortBy from 'lodash/sortBy'
import { ScrollPreview } from '../components/ScrollPreview'
import { getMockEpisode } from '../mocks/director.mock'
import type { ScrollInputCut } from '../lib/scrollTimeline'
import './ReviewPage.css'

type Decision = 'pending' | 'approved' | 'rejected'
const DECISION_META: Record<Decision, { label: string; color: string }> = {
  pending: { label: '검수 대기', color: '#faad14' },
  approved: { label: '승인됨', color: '#16a34a' },
  rejected: { label: '반려됨', color: '#dc2626' }
}

/**
 * 검수 화면(mock) — 캐스트(캐릭터별 성우) 선택 → 오디오 동기 스크롤 재생 → 승인/반려.
 */
export function ReviewPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const ep = useMemo(() => getMockEpisode(Number(id)), [id])

  const { characters, candidatesByCharacter } = useMemo(() => {
    if (!ep) return { characters: [] as { id: number; name: string }[], candidatesByCharacter: {} as Record<number, { creatorId: number; creatorName: string }[]> }
    const nameById = new Map(ep.characters.map((c) => [c.id, c.name]))
    const candByChar: Record<number, { creatorId: number; creatorName: string }[]> = {}
    const appearing = new Set<number>()
    for (const cut of ep.cuts) {
      for (const l of cut.lines) {
        appearing.add(l.characterId)
        const arr = (candByChar[l.characterId] ??= [])
        for (const t of l.takes) {
          if (!arr.some((c) => c.creatorId === t.creatorId)) arr.push({ creatorId: t.creatorId, creatorName: t.creatorName })
        }
      }
    }
    const chars = [...appearing].map((cid) => ({ id: cid, name: nameById.get(cid) ?? `캐릭터 #${cid}` }))
    return { characters: chars, candidatesByCharacter: candByChar }
  }, [ep])

  const [castByCharacter, setCastByCharacter] = useState<Record<number, number>>({})
  const castFor = useCallback(
    (characterId: number): number | undefined =>
      castByCharacter[characterId] ?? candidatesByCharacter[characterId]?.[0]?.creatorId,
    [castByCharacter, candidatesByCharacter]
  )

  const [decision, setDecision] = useState<Decision>('pending')

  const previewCuts = useMemo<ScrollInputCut[]>(() => {
    if (!ep) return []
    const nameById = new Map(ep.characters.map((c) => [c.id, c.name]))
    return ep.cuts.map((c) => ({
      imageUrl: c.imageUrl,
      imageWidth: c.imageWidth,
      imageHeight: c.imageHeight,
      holdMs: c.holdMs,
      lines: sortBy(c.lines, 'id').map((l) => {
        const creator = castFor(l.characterId)
        const take = l.takes.find((t) => t.creatorId === creator)
        return {
          id: l.id,
          script: l.script,
          characterName: nameById.get(l.characterId) ?? `캐릭터 #${l.characterId}`,
          anchorY: l.anchorY,
          gapBeforeMs: l.gapBeforeMs,
          durationMs: take?.durationMs
        }
      })
    }))
  }, [ep, castFor])

  if (!ep) {
    return (
      <div className="rv-empty">
        <p>회차를 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/review')}>
          검수 목록으로
        </button>
      </div>
    )
  }

  const dm = DECISION_META[decision]

  return (
    <div className="rv">
      <div className="rv__split">
        <div className="rv__main">
          <header className="rv__header">
            <button type="button" className="rv__back" onClick={() => navigate('/review')}>
              ← 검수 목록
            </button>
            <span className="rv__content">{ep.contentTitle}</span>
            <h2 className="rv__title">
              <span className="rv__chapter">{ep.chapter}화</span>
              {ep.title}
              <span className="rv__status" style={{ color: dm.color, background: `${dm.color}1a` }}>
                {dm.label}
              </span>
            </h2>
          </header>

          <section className="rv-cast">
            <span className="rv-cast__title">캐스트(배역) — 검수할 성우</span>
            <div className="rv-cast__list">
              {characters.map((ch) => {
                const cands = candidatesByCharacter[ch.id] ?? []
                return (
                  <div className="rv-cast__item" key={ch.id}>
                    <span className="rv-cast__char">{ch.name}</span>
                    {cands.length > 0 ? (
                      <select
                        className="rv-cast__select"
                        value={castFor(ch.id) ?? ''}
                        onChange={(e) => setCastByCharacter((p) => ({ ...p, [ch.id]: Number(e.target.value) }))}
                      >
                        {cands.map((c) => (
                          <option key={c.creatorId} value={c.creatorId}>
                            {c.creatorName} (#{c.creatorId})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rv-cast__empty">채택 take 없음</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <div className="rv-decision">
            <button
              type="button"
              className="rv-decision__approve"
              aria-pressed={decision === 'approved'}
              onClick={() => setDecision('approved')}
            >
              ✓ 승인
            </button>
            <button
              type="button"
              className="rv-decision__reject"
              aria-pressed={decision === 'rejected'}
              onClick={() => setDecision('rejected')}
            >
              ✕ 반려
            </button>
            {decision === 'approved' && (
              <button type="button" className="rv-decision__next" onClick={() => navigate(`/render/${ep.id}`)}>
                렌더로 →
              </button>
            )}
          </div>

          <p className="rv__note">⚠️ mock — 오디오 파일이 없어 스크롤만 재생됩니다(실 연동 시 채택 take 오디오 동기).</p>
        </div>

        <aside className="rv__side">
          <ScrollPreview cuts={previewCuts} audioByLine={{}} />
        </aside>
      </div>
    </div>
  )
}
