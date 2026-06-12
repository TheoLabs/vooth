/**
 * 연출 화면 mock — 실 API(회차 컷/대사 조회 + 연출 저장) 전까지 UI/UX 용.
 * 컷은 세로형(portrait) 원본 + cropBox(16:10 focal). 대사엔 anchorY/gap 일부만 지정(나머지 균등 분배 폴백).
 */

import { defaultCropBox } from '../lib/cropBox'
import type { DirCut, DirEpisode, DirLine } from '../types/direction'

const CUT_W = 720
const CUT_H = 1080

function cutImage(index: number): string {
  const box = defaultCropBox(CUT_W, CUT_H)
  const bx = Math.round(box.x * CUT_W)
  const by = Math.round(box.y * CUT_H)
  const bw = Math.round(box.w * CUT_W)
  const bh = Math.round(box.h * CUT_H)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CUT_W}" height="${CUT_H}" viewBox="0 0 ${CUT_W} ${CUT_H}"><rect width="${CUT_W}" height="${CUT_H}" fill="#1e293b"/><rect x="2" y="2" width="${CUT_W - 4}" height="${CUT_H - 4}" fill="none" stroke="#334155" stroke-width="3"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#334155" opacity="0.5"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#64748b" stroke-width="3" stroke-dasharray="12 8"/><text x="${CUT_W / 2}" y="${CUT_H / 2}" font-family="sans-serif" font-size="72" font-weight="800" fill="#475569" text-anchor="middle">컷 ${index}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const SAMPLE: { character: string; script: string }[] = [
  { character: '아린', script: '여기가... 그 전설의 장소인가.' },
  { character: '카엘', script: '경계를 늦추지 마. 무슨 일이 일어날지 몰라.' },
  { character: '검의 정령', script: '드디어 네가 왔구나. 오래 기다렸다.' },
  { character: '아린', script: '이 검을... 제가 들어도 되나요?' },
  { character: '카엘', script: '함정일 수도 있어. 천천히.' },
  { character: '정체불명', script: '흥, 거기까지다.' }
]

let lineSeq = 0
function mkLine(anchorY?: number, gapBeforeMs?: number): DirLine {
  const s = SAMPLE[lineSeq % SAMPLE.length]
  lineSeq += 1
  return { id: 1000 + lineSeq, characterName: s.character, script: s.script, anchorY, gapBeforeMs }
}

const cuts: DirCut[] = [1, 2, 3, 4].map((n, i) => {
  const lines =
    i === 0
      ? [mkLine(0.25), mkLine(0.7, 300)]
      : i === 1
        ? [mkLine(0.2), mkLine(0.55), mkLine(0.85, 200)]
        : i === 2
          ? [mkLine(), mkLine(0.6)]
          : [mkLine(0.4, 500)]
  return {
    id: 100 + n,
    imageUrl: cutImage(n),
    imageWidth: CUT_W,
    imageHeight: CUT_H,
    cropBox: defaultCropBox(CUT_W, CUT_H),
    holdMs: i === 3 ? 800 : 400,
    lines
  }
})

export const MOCK_DIR_EPISODES: DirEpisode[] = [
  { id: 1, contentTitle: '달빛 기사단', chapter: 1, title: '프롤로그 — 깨어난 검', cuts },
  {
    id: 2,
    contentTitle: '달빛 기사단',
    chapter: 2,
    title: '은빛 숲의 약속',
    cuts: cuts.map((c, i) => ({ ...c, id: 200 + i })) // 동일 구성 재사용(샘플)
  }
]

export function getMockDirEpisode(id: number): DirEpisode | undefined {
  return MOCK_DIR_EPISODES.find((e) => e.id === id)
}
