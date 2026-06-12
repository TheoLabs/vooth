import type { CSSProperties } from 'react';
import { cropFrameImgStyle, FRAME_RATIO, type CropBox } from '../lib/cropBox';

interface CropFrameProps {
  /** 원본 이미지 URL. */
  src?: string;
  /** 정규화 크롭 박스. 없으면 object-fit: cover 폴백. */
  cropBox?: CropBox | null;
  /** 프레임 가로폭(px). height 미지정 시 ratio 로 계산. */
  width?: number;
  height?: number;
  ratio?: number;
  radius?: number;
  alt?: string;
}

/**
 * 원본 + 크롭 박스로 고정 비율(기본 16:10) 썸네일을 CSS 로 그려주는 표시 컴포넌트.
 * 별도 크롭 파일 없이 원본 1장으로 여러 곳(리스트/상세/카드)에서 일관된 프레임을 만든다.
 */
export function CropFrame({
  src,
  cropBox,
  width = 160,
  height,
  ratio = FRAME_RATIO,
  radius = 8,
  alt = '',
}: CropFrameProps) {
  const h = height ?? Math.round(width / ratio);
  const wrapper: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width,
    height: h,
    borderRadius: radius,
    background: '#f0f0f0',
    flex: '0 0 auto',
  };

  if (!src) return <div style={wrapper} />;

  return (
    <div style={wrapper}>
      <img src={src} alt={alt} style={cropFrameImgStyle(cropBox)} draggable={false} />
    </div>
  );
}
