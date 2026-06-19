import type { CropBox } from '../domain/types'

interface CropAnchorViewProps {
  imageUrl: string
  cropBox: CropBox
  /** 컷 내 라인 앵커(anchorY 0~1). null 은 표시 안 함(폴백). */
  anchors: { id: number; anchorY: number | null; color: string }[]
}

/**
 * 컷 이미지 위에 cropBox(focal 표시 영역, 주황 박스 + 외곽 디밍)와
 * 라인별 anchorY(빨간 가로선=발화 세로 위치)를 시각화한다. docs §15.
 * 읽기전용 시각화(드래그 편집은 후속 — back-office 저작 모델과 동일 좌표계).
 */
export function CropAnchorView({ imageUrl, cropBox, anchors }: CropAnchorViewProps): React.JSX.Element {
  return (
    <div>
      <div className="ed-crop">
        <img className="ed-crop__img" src={imageUrl} alt="컷 이미지(mock)" />
        <div
          className="ed-crop__box"
          style={{
            left: `${cropBox.x * 100}%`,
            top: `${cropBox.y * 100}%`,
            width: `${cropBox.w * 100}%`,
            height: `${cropBox.h * 100}%`
          }}
        >
          <span className="ed-crop__box-label">crop</span>
        </div>
        {anchors.map((a, i) =>
          a.anchorY == null ? null : (
            <div key={a.id} className="ed-anchor" style={{ top: `${a.anchorY * 100}%` }}>
              <span className="ed-anchor__label">L{i + 1}</span>
              <span className="ed-anchor__dot" style={{ background: a.color }} />
            </div>
          )
        )}
      </div>
      <div className="ed-crop__legend">
        <span>
          <span className="ed-crop__swatch" style={{ background: '#f59e0b' }} /> cropBox(표시 영역)
        </span>
        <span>
          <span className="ed-crop__swatch" style={{ background: '#ef4444' }} /> anchorY(발화 위치)
        </span>
      </div>
    </div>
  )
}
