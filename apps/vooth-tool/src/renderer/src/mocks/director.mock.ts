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

// --- 검수 목록(콘텐츠 기반) mock ---
export type ReviewStatus = 'review' | 'approved' | 'rejected'
export interface MockTag {
  id: number
  name: string
  /** TagColor 문자열(RED/BLUE…) */
  color: string
}
export interface MockReviewEpisode {
  id: number
  chapter: number
  title: string
  status: ReviewStatus
  cutCount: number
  lineCount: number
  /** 채택된 take 기준 예상 영상 길이(ms). */
  durationMs: number
  /** 멀티캐스팅 — 참여 성우 수. */
  castCount: number
  /** 마지막 갱신(ISO, UTC). */
  updatedAt: string
}
export interface MockContent {
  id: number
  title: string
  description: string
  thumbnailImageUrl: string
  tags: MockTag[]
  episodes: MockReviewEpisode[]
}

function contentThumb(title: string): string {
  const initial = title.trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#1e293b"/><text x="240" y="172" font-family="sans-serif" font-size="120" font-weight="800" fill="#475569" text-anchor="middle">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const MOCK_CONTENTS: MockContent[] = [
  {
    id: 1,
    title: '화산귀환',
    description: '대화산파 13대 제자, 매화검존 청명. 백년의 시간을 넘어 어린아이의 몸으로 다시 살아난다.',
    thumbnailImageUrl: contentThumb('화산귀환'),
    tags: [
      { id: 1, name: '무협', color: 'RED' },
      { id: 2, name: '액션', color: 'ORANGE' },
      { id: 3, name: '회귀', color: 'PURPLE' }
    ],
    episodes: [
      { id: 1, chapter: 1, title: '서(序), 이게 뭐가 어떻게 돌아가는 상황이야?', status: 'review', cutCount: 4, lineCount: 7, durationMs: 78_000, castCount: 3, updatedAt: '2026-06-12T04:20:00.000Z' },
      { id: 2, chapter: 2, title: '돌아온 매화검존', status: 'approved', cutCount: 5, lineCount: 9, durationMs: 95_000, castCount: 3, updatedAt: '2026-06-10T09:11:00.000Z' },
      { id: 3, chapter: 3, title: '십만대산의 손님', status: 'rejected', cutCount: 6, lineCount: 11, durationMs: 110_000, castCount: 4, updatedAt: '2026-06-09T01:45:00.000Z' }
    ]
  },
  {
    id: 2,
    title: '나 혼자만 레벨업',
    description: 'E급 헌터 성진우. 이중 던전에서 죽음의 문턱을 넘어 홀로 레벨업하는 능력을 얻는다.',
    thumbnailImageUrl: contentThumb('나 혼자만 레벨업'),
    tags: [
      { id: 4, name: '판타지', color: 'BLUE' },
      { id: 5, name: '액션', color: 'ORANGE' }
    ],
    episodes: [
      { id: 11, chapter: 1, title: '약자', status: 'review', cutCount: 5, lineCount: 8, durationMs: 88_000, castCount: 2, updatedAt: '2026-06-13T07:30:00.000Z' },
      { id: 12, chapter: 2, title: '각성', status: 'review', cutCount: 6, lineCount: 10, durationMs: 102_000, castCount: 2, updatedAt: '2026-06-13T08:05:00.000Z' }
    ]
  }
]

function buildReviewEpisodes(contentId: number): MockReviewEpisode[] {
  const statuses: ReviewStatus[] = ['review', 'approved', 'rejected']
  return Array.from({ length: 3 }, (_, i) => ({
    id: contentId * 100 + (i + 1),
    chapter: i + 1,
    title: `${i + 1}화 (mock)`,
    status: statuses[i],
    cutCount: 4 + i,
    lineCount: 7 + i * 2,
    durationMs: 80_000 + i * 12_000,
    castCount: 2 + (i % 2),
    updatedAt: new Date(Date.now() - i * 86_400_000).toISOString()
  }))
}

export function getMockContent(id: number): MockContent | undefined {
  if (!id || Number.isNaN(id)) return undefined
  // 목록은 실 API(real id) → 어떤 id가 와도 mock 상세를 만들어 보여준다.
  return (
    MOCK_CONTENTS.find((c) => c.id === id) ?? {
      id,
      title: `콘텐츠 #${id}`,
      description: '검수 대상 콘텐츠(mock). 실제 데이터 연동 전 UI/UX 확인용입니다.',
      thumbnailImageUrl: contentThumb(`#${id}`),
      tags: [{ id: 99, name: '검수 대기', color: 'GRAY' }],
      episodes: buildReviewEpisodes(id)
    }
  )
}

export function getMockEpisode(id: number): MockEpisode | undefined {
  if (!id || Number.isNaN(id)) return undefined
  // 목록은 실 API(real id)라, 어떤 id가 와도 mock 상세를 만들어 보여준다(UI/UX용).
  const meta = MOCK_EPISODES.find((e) => e.id === id)
  return buildEpisode(id, meta?.chapter ?? 1, meta?.title ?? '검수 샘플 회차')
}
