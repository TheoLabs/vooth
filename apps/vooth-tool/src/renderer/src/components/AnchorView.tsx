interface AnchorViewProps {
  imageUrl: string
  /** 컷 내 라인 앵커(anchorY 0~1). null 은 표시 안 함(폴백=균등). */
  anchors: { id: number; anchorY: number | null; color: string }[]
}

/**
 * 컷 이미지 위에 라인별 anchorY(발화 세로 위치) 가로선을 시각화한다(읽기전용).
 * cropBox 는 Cut 도메인에서 제거됨 — 더 이상 표시하지 않는다.
 */
export function AnchorView({ imageUrl, anchors }: AnchorViewProps): React.JSX.Element {
  return (
    <div>
      <div className="ed-crop">
        <img className="ed-crop__img" src={imageUrl} alt="컷 이미지(mock)" />
        {anchors.map((a, i) =>
          a.anchorY == null ? null : (
            <div key={a.id} className="ed-anchor" style={{ top: `${a.anchorY * 100}%` }}>
              <span className="ed-anchor__label">L{i + 1}</span>
              <span className="ed-anchor__dot" style={{ background: a.color }} />
            </div>
          )
        )}
      </div>
    </div>
  )
}
