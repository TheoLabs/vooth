/**
 * 검수/렌더 화면용 mock 데이터. (실 API 연동 전 UI/UX 용)
 * 멀티캐스팅: 캐릭터별로 여러 성우의 채택 take.
 */

const CUT_W = 720
const CUT_H = 1080

function cutImage(index: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CUT_W}" height="${CUT_H}" viewBox="0 0 ${CUT_W} ${CUT_H}"><rect width="${CUT_W}" height="${CUT_H}" fill="#1e293b"/><rect x="2" y="2" width="${CUT_W - 4}" height="${CUT_H - 4}" fill="none" stroke="#334155" stroke-width="3"/><text x="${CUT_W / 2}" y="${CUT_H / 2}" font-family="sans-serif" font-size="80" font-weight="800" fill="#475569" text-anchor="middle">컷 ${index}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export interface MockTake {
  creatorId: number
  creatorName: string
  durationMs: number
}
export interface MockLine {
  id: number
  characterId: number
  script: string
  anchorY?: number
  gapBeforeMs?: number
  takes: MockTake[]
}
export interface MockCut {
  id: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  holdMs?: number
  lines: MockLine[]
}
export interface MockEpisode {
  id: number
  contentTitle: string
  chapter: number
  title: string
  characters: { id: number; name: string }[]
  cuts: MockCut[]
}

export interface MockEpisodeListItem {
  id: number
  contentTitle: string
  chapter: number
  title: string
  cutCount: number
  lineCount: number
  /** 검수 상태(mock). */
  status: 'review' | 'approved' | 'rejected'
}

const CHARS = [
  { id: 1, name: '아린' },
  { id: 2, name: '카엘' },
  { id: 3, name: '검의 정령' }
]
// 멀티캐스팅: 아린=김정호·박서준, 카엘=박서준, 검의 정령=이도윤
const CASTS: Record<number, MockTake[]> = {
  1: [
    { creatorId: 101, creatorName: '김정호', durationMs: 2600 },
    { creatorId: 102, creatorName: '박서준', durationMs: 2900 }
  ],
  2: [{ creatorId: 102, creatorName: '박서준', durationMs: 2200 }],
  3: [{ creatorId: 103, creatorName: '이도윤', durationMs: 3400 }]
}

const SAMPLE: { characterId: number; script: string; anchorY: number }[] = [
  { characterId: 1, script: '여기가… 그 전설의 장소인가.', anchorY: 0.3 },
  { characterId: 2, script: '경계를 늦추지 마. 무슨 일이 일어날지 몰라.', anchorY: 0.65 },
  { characterId: 3, script: '드디어 네가 왔구나. 오래 기다렸다.', anchorY: 0.4 },
  { characterId: 1, script: '이 검을… 제가 들어도 되나요?', anchorY: 0.55 },
  { characterId: 2, script: '천천히. 함정일 수도 있어.', anchorY: 0.35 },
  { characterId: 3, script: '두려워 말거라.', anchorY: 0.6 }
]

function buildEpisode(id: number, chapter: number, title: string): MockEpisode {
  let lineSeq = 0
  const cuts: MockCut[] = [1, 2, 3, 4].map((n, i) => {
    const count = i === 1 ? 2 : i === 3 ? 1 : 2
    const lines: MockLine[] = Array.from({ length: count }, () => {
      const s = SAMPLE[lineSeq % SAMPLE.length]
      lineSeq += 1
      return {
        id: id * 1000 + lineSeq,
        characterId: s.characterId,
        script: s.script,
        anchorY: s.anchorY,
        gapBeforeMs: 200,
        takes: CASTS[s.characterId] ?? []
      }
    })
    return { id: id * 100 + n, imageUrl: cutImage(n), imageWidth: CUT_W, imageHeight: CUT_H, holdMs: 400, lines }
  })
  return { id, contentTitle: '화산귀환', chapter, title, characters: CHARS, cuts }
}

export const MOCK_EPISODES: MockEpisodeListItem[] = [
  { id: 1, contentTitle: '화산귀환', chapter: 1, title: '서(序), 이게 뭐가 어떻게 돌아가는 상황이야?', cutCount: 4, lineCount: 7, status: 'review' },
  { id: 2, contentTitle: '화산귀환', chapter: 2, title: '돌아온 매화검존', cutCount: 4, lineCount: 7, status: 'approved' }
]

export function getMockEpisode(id: number): MockEpisode | undefined {
  const meta = MOCK_EPISODES.find((e) => e.id === id)
  if (!meta) return undefined
  return buildEpisode(meta.id, meta.chapter, meta.title)
}
