/**
 * 녹음 화면용 mock — core-api 의 Episode/Cut/Line/Recording 형태(recording-domain.ts)로 생성한다.
 *
 * 성우용 "회차 컷/대사 상세 + 녹음" API 가 아직 없으므로, 회차 목록 항목(EpisodeListItem)의
 * 실제 cutCount/lineCount 에 맞춰 컷/대사를 만든다. 헤더(콘텐츠/화수/제목/상태)는 실데이터.
 * 컷 이미지는 CSP-safe 인라인 data: SVG.
 */

import type { EpisodeListItem } from '../api/episodes.api'
import { RecordingStatus, type Cut, type Line, type Recording, type RecordingEpisode } from '../types/recording-domain'

/** characterId → 이름 (실제로는 character 조회로 채워진다). */
export const MOCK_CHARACTERS: Record<number, string> = {
  1: '아린',
  2: '카엘',
  3: '검의 정령',
  4: '정체불명'
}

/** 샘플 대사 풀(characterId + script). lineCount 만큼 순환. */
const SAMPLE_LINES: { characterId: number; script: string }[] = [
  { characterId: 1, script: '여기가... 그 전설의 장소인가.' },
  { characterId: 2, script: '경계를 늦추지 마. 무슨 일이 일어날지 몰라.' },
  { characterId: 1, script: '저 빛은 대체 뭐지?' },
  { characterId: 3, script: '드디어 네가 왔구나. 오래 기다렸다.' },
  { characterId: 2, script: '함정일 수도 있어. 천천히 움직여.' },
  { characterId: 1, script: '괜찮아, 내가 앞장설게.' },
  { characterId: 4, script: '흥, 거기까지다.' },
  { characterId: 3, script: '이 검을 들어라. 그것이 네 운명이다.' },
  { characterId: 1, script: '내... 운명이라고?' },
  { characterId: 2, script: '여기는 옛 기사단의 성소다.' }
]

/** 시드용 다른 성우(나 이외). */
const SEED_CREATORS = [
  { id: 9001, name: '박서준' },
  { id: 9002, name: '이도윤' },
  { id: 9003, name: '최유나' }
]

function cutPlaceholder(index: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#e2e8f0"/><rect x="1" y="1" width="638" height="358" fill="none" stroke="#cbd5e1" stroke-width="2"/><text x="320" y="190" font-family="sans-serif" font-size="40" font-weight="700" fill="#94a3b8" text-anchor="middle">컷 ${index}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** total 개를 buckets 개에 최대한 균등 분배. */
function distribute(total: number, buckets: number): number[] {
  const base = Math.floor(total / buckets)
  const rest = total % buckets
  return Array.from({ length: buckets }, (_, i) => base + (i < rest ? 1 : 0))
}

export interface RecordingEpisodeMock {
  episode: RecordingEpisode
  charactersById: Record<number, string>
  /** lineId → 시드된 다른 성우 녹음(take)들. */
  initialRecordings: Record<number, Recording[]>
}

/**
 * 회차 목록 항목 + 콘텐츠 제목으로 녹음 화면용 도메인 mock 을 만든다.
 * 컷/대사 수는 실데이터(cutCount/lineCount)를 따르되, 비어 있으면 데모용 기본값.
 */
export function buildRecordingEpisode(item: EpisodeListItem, contentTitle: string): RecordingEpisodeMock {
  const cutCount = item.cutCount > 0 ? item.cutCount : 3
  const lineCount = item.lineCount > 0 ? item.lineCount : 6
  const perCut = distribute(lineCount, cutCount)

  const initialRecordings: Record<number, Recording[]> = {}
  let lineSeq = 0
  let seedSeq = 0

  const cuts: Cut[] = Array.from({ length: cutCount }, (_, ci) => {
    const cutId = item.id * 1000 + (ci + 1)

    const lines: Line[] = Array.from({ length: perCut[ci] ?? 0 }, (_, li) => {
      const sample = SAMPLE_LINES[lineSeq % SAMPLE_LINES.length]
      const lineId = cutId * 100 + (li + 1)

      // 3개 중 1개꼴로 다른 성우 take 1개를 시드(멀티캐스팅 + 검수 상태 노출).
      if (lineSeq % 3 === 1) {
        const creator = SEED_CREATORS[seedSeq % SEED_CREATORS.length]
        const statusCycle = [RecordingStatus.RECORDED, RecordingStatus.REVIEW, RecordingStatus.APPROVED]
        initialRecordings[lineId] = [
          {
            id: item.id * 100000 + seedSeq + 1,
            lineId,
            episodeId: item.id,
            creatorId: creator.id,
            creatorName: creator.name,
            durationMs: 2200 + (seedSeq % 4) * 400,
            status: statusCycle[seedSeq % statusCycle.length],
            take: 1
          }
        ]
        seedSeq += 1
      }

      const line: Line = {
        id: lineId,
        cutId,
        episodeId: item.id,
        characterId: sample.characterId,
        position: (li + 1) * 10,
        script: sample.script
      }
      lineSeq += 1
      return line
    })

    return {
      id: cutId,
      episodeId: item.id,
      position: (ci + 1) * 10,
      imageUrl: cutPlaceholder(ci + 1),
      lines
    }
  })

  const episode: RecordingEpisode = {
    id: item.id,
    contentId: item.contentId,
    contentTitle,
    title: item.title,
    chapter: item.chapter,
    status: item.status,
    cutCount,
    lineCount,
    cuts
  }

  return { episode, charactersById: MOCK_CHARACTERS, initialRecordings }
}
