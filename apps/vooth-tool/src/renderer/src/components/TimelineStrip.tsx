import type { Cut } from '../domain/types'
import { buildTimeline } from '../domain/timeline'
import { formatMs } from '../domain/format'

/**
 * 컷/라인을 gap·hold·추정 길이로 가로 배치한 타임라인 strip(mock).
 * 라인 = 컬러 세그먼트, gap(양수)=어두운 간격, 겹침(음수)=빗금, hold=회색.
 */
export function TimelineStrip({
  cuts,
  characterColor
}: {
  cuts: Cut[]
  characterColor: (characterId: number) => string
}): React.JSX.Element {
  const tl = buildTimeline(cuts)
  const PX_PER_MS = 0.06 // 스케일

  return (
    <div>
      <div className="ed-timeline">
        {tl.cuts.map((cutSeg) => {
          const cut = cuts.find((c) => c.id === cutSeg.cutId)!
          return (
            <div key={cutSeg.cutId} className="ed-tl-cut">
              {cutSeg.lines.map((ls) => {
                const line = cut.lines.find((l) => l.id === ls.lineId)!
                const segs: React.JSX.Element[] = []
                // gap 표현(양수=간격 / 음수=겹침 빗금).
                if (ls.gapBeforeMs > 0) {
                  segs.push(
                    <div
                      key={`g-${ls.lineId}`}
                      className="ed-tl-seg ed-tl-seg--gap"
                      style={{ width: Math.max(4, ls.gapBeforeMs * PX_PER_MS) }}
                      title={`gap +${ls.gapBeforeMs}ms`}
                    />
                  )
                } else if (ls.gapBeforeMs < 0) {
                  segs.push(
                    <div
                      key={`o-${ls.lineId}`}
                      className="ed-tl-seg ed-tl-seg--overlap"
                      style={{ width: Math.max(4, Math.abs(ls.gapBeforeMs) * PX_PER_MS) }}
                      title={`겹침 ${Math.abs(ls.gapBeforeMs)}ms`}
                    />
                  )
                }
                segs.push(
                  <div
                    key={`l-${ls.lineId}`}
                    className="ed-tl-seg"
                    style={{
                      width: Math.max(28, ls.durationMs * PX_PER_MS),
                      background: characterColor(line.characterId)
                    }}
                    title={`${formatMs(ls.durationMs)}`}
                  >
                    {formatMs(ls.durationMs)}
                  </div>
                )
                return segs
              })}
              {cutSeg.holdMs > 0 && (
                <div
                  className="ed-tl-seg ed-tl-seg--hold"
                  style={{ width: Math.max(6, cutSeg.holdMs * PX_PER_MS) }}
                  title={`hold ${cutSeg.holdMs}ms`}
                >
                  hold
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="ed-tl-legend">
        <span>총 길이 {formatMs(tl.totalMs)}</span>
        <span>· 색 막대 = 대사(추정 길이)</span>
        <span>· 빗금 = 겹침(음수 gap)</span>
        <span>· 회색 = hold</span>
        <span style={{ color: '#94a3b8' }}>(길이는 채택 take durationMs 에서 유도 — mock 추정)</span>
      </div>
    </div>
  )
}
