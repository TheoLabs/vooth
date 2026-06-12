import type { CSSProperties } from 'react'

/**
 * 정규화 크롭 박스(0~1). 원본 이미지에서 "보여줄 사각형 영역".
 * 저장 모델 (B): 컷은 원본 1장 + 이 박스만 저장하고, 16:10 표시는 CSS 로 유도한다.
 * (core-api Cut.cropBox 와 동일 형태.)
 */
export interface CropBox {
  x: number
  y: number
  w: number
  h: number
}

/** 기본 표시 비율(16:10). */
export const FRAME_RATIO = 16 / 10

/** 원본에서 ratio 비율의 최대 크롭 박스를 중앙 정렬로 계산. */
export function defaultCropBox(naturalW: number, naturalH: number, ratio = FRAME_RATIO): CropBox {
  if (naturalW <= 0 || naturalH <= 0) return { x: 0, y: 0, w: 1, h: 1 }
  const imgRatio = naturalW / naturalH
  if (imgRatio > ratio) {
    const w = (ratio * naturalH) / naturalW
    return { x: (1 - w) / 2, y: 0, w, h: 1 }
  }
  const h = naturalW / ratio / naturalH
  return { x: 0, y: (1 - h) / 2, w: 1, h }
}

/**
 * 크롭 박스를 고정 비율 프레임에 꽉 채워 보여주기 위한 img CSS.
 * wrapper(overflow hidden, 비율 고정) 안에서 원본을 박스 영역만큼 확대·이동한다.
 * 박스가 없으면 object-fit: cover 폴백.
 */
export function cropFrameImgStyle(cropBox?: CropBox | null): CSSProperties {
  if (!cropBox || cropBox.w <= 0 || cropBox.h <= 0) {
    return { width: '100%', height: '100%', objectFit: 'cover' }
  }
  const { x, y, w, h } = cropBox
  return {
    position: 'absolute',
    width: `${100 / w}%`,
    height: `${100 / h}%`,
    left: `${(-100 * x) / w}%`,
    top: `${(-100 * y) / h}%`,
    maxWidth: 'none'
  }
}
