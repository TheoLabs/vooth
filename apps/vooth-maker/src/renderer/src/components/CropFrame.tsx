import type { CSSProperties } from 'react'
import { cropFrameImgStyle, FRAME_RATIO, type CropBox } from '../lib/cropBox'

interface CropFrameProps {
  /** 원본 이미지 URL. */
  src?: string
  /** 정규화 크롭 박스. 없으면 cover 폴백. */
  cropBox?: CropBox | null
  ratio?: number
  radius?: number
  className?: string
  alt?: string
}

/**
 * 원본 + 크롭 박스로 고정 비율(기본 16:10) 프레임을 CSS 로 그려주는 표시 컴포넌트.
 * 너비는 100%(부모 기준), 높이는 aspect-ratio 로 잡는다.
 */
export function CropFrame({
  src,
  cropBox,
  ratio = FRAME_RATIO,
  radius = 0,
  className,
  alt = ''
}: CropFrameProps): React.JSX.Element {
  const wrapper: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: String(ratio),
    borderRadius: radius,
    background: '#0f172a'
  }
  return (
    <div className={className} style={wrapper}>
      {src && <img src={src} alt={alt} style={cropFrameImgStyle(cropBox)} draggable={false} />}
    </div>
  )
}
