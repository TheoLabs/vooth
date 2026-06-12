import { useCallback, useEffect, useRef, useState } from 'react'
import './AnchorStage.css'

export interface AnchorStageLine {
  id: number
  anchorY?: number
}

const COLORS = ['#6366f1', '#16a34a', '#ea580c', '#9333ea', '#db2777', '#0891b2']

export function anchorEven(index: number, count: number): number {
  return count > 0 ? (index + 0.5) / count : 0.5
}

/**
 * 컷 원본 이미지 위에 대사 마커를 세로 드래그해 anchorY(0~1)를 지정한다.
 * (연속 스크롤이 이 지점으로 맞춰진다. 미지정이면 균등 분배 표시.)
 */
export function AnchorStage({
  imageUrl,
  lines,
  onChange
}: {
  imageUrl: string
  lines: AnchorStageLine[]
  onChange: (lineId: number, anchorY: number) => void
}): React.JSX.Element {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const ratioFromY = useCallback((clientY: number): number => {
    const el = stageRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
  }, [])

  useEffect(() => {
    if (dragId == null) return
    const onMove = (e: PointerEvent): void => onChange(dragId, ratioFromY(e.clientY))
    const onUp = (): void => setDragId(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragId, onChange, ratioFromY])

  return (
    <div className="as" ref={stageRef}>
      <img className="as__img" src={imageUrl} alt="컷" draggable={false} />
      {lines.map((line, i) => {
        const y = line.anchorY ?? anchorEven(i, lines.length)
        const color = COLORS[i % COLORS.length]
        return (
          <div
            key={line.id}
            className="as__marker"
            style={{ top: `${y * 100}%` }}
            onPointerDown={() => setDragId(line.id)}
          >
            <span className="as__badge" style={{ background: color }}>
              {i + 1}
            </span>
            <span className="as__line" style={{ background: color }} />
          </div>
        )
      })}
    </div>
  )
}
