/**
 * 녹음 화면용 mock 회차 생성기.
 *
 * 성우용 회차 "컷/대사 상세" API가 아직 없으므로, 회차 목록 항목(EpisodeListItem)의
 * 실제 cutCount/lineCount 에 맞춰 컷/대사를 mock 으로 생성한다.
 * - 헤더(작품/화수/제목)는 실데이터(목록 항목 + 콘텐츠 제목)를 그대로 쓴다.
 * - 컷 이미지는 CSP-safe 인라인 data: SVG placeholder.
 * - 일부 대사에는 다른 성우의 take 를 시드해 멀티캐스팅(최종 선택) UX 가 보이게 한다.
 */

import type { EpisodeListItem } from '../api/episodes.api'
import type { Cut, Episode, Line, Recording, RecordingStatus } from '../types/domain'

/** 샘플 대사 풀(캐릭터 + 대사). lineCount 만큼 순환 사용. */
const SAMPLE_LINES: { character?: string; text: string }[] = [
  { character: '아린', text: '여기가... 그 전설의 장소인가.' },
  { character: '카엘', text: '경계를 늦추지 마. 무슨 일이 일어날지 몰라.' },
  { character: '아린', text: '저 빛은 대체 뭐지?' },
  { character: '검의 정령', text: '드디어 네가 왔구나. 오래 기다렸다.' },
  { character: '카엘', text: '함정일 수도 있어. 천천히 움직여.' },
  { character: '아린', text: '괜찮아, 내가 앞장설게.' },
  { character: '정체불명', text: '흥, 거기까지다.' },
  { character: '검의 정령', text: '이 검을 들어라. 그것이 네 운명이다.' },
  { character: undefined, text: '쿠르릉— (멀리서 들려오는 천둥소리)' },
  { character: '아린', text: '내... 운명이라고?' }
]

/** 시드용 다른 성우 take 후보. */
const SEED_ACTORS = [
  { id: 'va-002', name: '박서준' },
  { id: 'va-003', name: '이도윤' },
  { id: 'va-004', name: '최유나' }
]

function cutPlaceholder(order: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#e2e8f0"/><rect x="1" y="1" width="638" height="358" fill="none" stroke="#cbd5e1" stroke-width="2"/><text x="320" y="190" font-family="sans-serif" font-size="40" font-weight="700" fill="#94a3b8" text-anchor="middle">컷 ${order}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** lineCount 개의 대사를 cutCount 개의 컷에 최대한 균등 분배한다. */
function distribute(total: number, buckets: number): number[] {
  const base = Math.floor(total / buckets)
  const rest = total % buckets
  return Array.from({ length: buckets }, (_, i) => base + (i < rest ? 1 : 0))
}

/**
 * 실제 회차 항목 + 콘텐츠 제목으로 mock Episode(컷/대사) 를 만든다.
 * 컷/대사 수는 실데이터(cutCount/lineCount)를 따르되, 비어 있으면 데모용 기본값을 쓴다.
 */
export function buildMockEpisode(item: EpisodeListItem, contentTitle: string): Episode {
  const cutCount = item.cutCount > 0 ? item.cutCount : 3
  const lineCount = item.lineCount > 0 ? item.lineCount : 6
  const perCut = distribute(lineCount, cutCount)

  let lineSeq = 0
  let seedSeq = 0

  const cuts: Cut[] = Array.from({ length: cutCount }, (_, ci) => {
    const lines: Line[] = Array.from({ length: perCut[ci] ?? 0 }, (_, li) => {
      const sample = SAMPLE_LINES[lineSeq % SAMPLE_LINES.length]
      const lineId = `m-${item.id}-l${lineSeq + 1}`

      // 3개 중 1개꼴로 다른 성우의 take 1개를 시드(최종 미선택 → "최종 선택" UX 노출).
      const recordings: Recording[] = []
      if (lineSeq % 3 === 1) {
        const actor = SEED_ACTORS[seedSeq % SEED_ACTORS.length]
        const status: RecordingStatus = seedSeq % 2 === 0 ? 'DONE' : 'REVIEW'
        recordings.push({
          id: `m-${item.id}-seed${seedSeq + 1}`,
          lineId,
          voiceActorId: actor.id,
          voiceActorName: actor.name,
          status,
          durationMs: 2200 + (seedSeq % 4) * 400
        })
        seedSeq += 1
      }

      const line: Line = {
        id: lineId,
        order: li + 1,
        text: sample.text,
        character: sample.character,
        gapBeforeMs: 0,
        recordings
      }
      lineSeq += 1
      return line
    })

    return {
      id: `m-${item.id}-c${ci + 1}`,
      order: ci + 1,
      imageUrl: cutPlaceholder(ci + 1),
      holdMs: 500,
      lines
    }
  })

  return {
    id: String(item.id),
    webtoonId: String(item.contentId),
    webtoonTitle: contentTitle,
    episodeNo: item.chapter,
    title: item.title,
    cuts
  }
}
