/**
 * 연출(direction) 화면용 타입 — core-api Episode/Cut/Line + 연출 필드(anchorY/gap/hold) 매핑.
 * (실 API 연동 전 mock 용. 필드는 core-api 와 동일 의미.)
 */

import type { CropBox } from '../lib/cropBox'

export interface DirLine {
  id: number
  characterName: string
  script: string
  /** 컷 내 세로 위치(0~1). 미지정이면 균등 분배 폴백. */
  anchorY?: number
  /** 이 대사 앞 간격(ms). */
  gapBeforeMs?: number
}

export interface DirCut {
  id: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  cropBox?: CropBox
  /** 컷 끝 머무는 시간(ms). */
  holdMs?: number
  lines: DirLine[]
}

export interface DirEpisode {
  id: number
  contentTitle: string
  chapter: number
  title: string
  cuts: DirCut[]
}
