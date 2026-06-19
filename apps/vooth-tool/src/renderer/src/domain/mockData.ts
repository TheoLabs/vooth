/**
 * ⚠️ MOCK 데이터 — 연출·제작 화면 UX 선행용. 실제 directors/* API 미배선.
 *
 * 도메인: docs/content-domain-design.md §12~16 기준.
 * 실제 배선 시: 이 파일을 directors/* 쿼리(react-query)로 대체한다.
 */
import {
  CharacterType,
  CutTransition,
  EpisodeStatus,
  RecordingStatus,
  type Cast,
  type Character,
  type Cut,
  type EpisodeDetail,
  type EpisodeSummary,
  type Recording
} from './types'

/* 색상 팔레트(SVG placeholder 컷 배경에 재사용). */
const CUT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

/**
 * 컷 이미지 placeholder. 실제 imageUrl(S3) 대신 인라인 SVG data-uri 를 생성한다.
 * 세로 웹툰 비율을 흉내내기 위해 w/h 를 받는다.
 */
export function mockCutImage(label: string, w: number, h: number, colorIndex: number): string {
  const c = CUT_COLORS[colorIndex % CUT_COLORS.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='${c}' stop-opacity='0.85'/>
      <stop offset='1' stop-color='${c}' stop-opacity='0.45'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' fill='#ffffff' font-family='sans-serif' font-size='${Math.round(w / 8)}' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${label}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** mock 파형(seed 기반 의사난수로 결정적 생성). */
function mockWaveform(seed: number, bars = 48): number[] {
  const out: number[] = []
  let s = seed
  for (let i = 0; i < bars; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    // 가운데가 큰 종 모양 envelope.
    const env = Math.sin((i / bars) * Math.PI)
    out.push(0.15 + r * 0.7 * (0.4 + env * 0.6))
  }
  return out
}

/* ──────────────────────────── 작품/캐릭터/캐스트 ──────────────────────────── */

const CHARACTERS: Character[] = [
  { id: 1, contentId: 1, name: '나리', type: CharacterType.MAIN, color: '#ef4444' },
  { id: 2, contentId: 1, name: '도윤', type: CharacterType.MAIN, color: '#3b82f6' },
  { id: 3, contentId: 1, name: '선생님', type: CharacterType.SUPPORTING, color: '#10b981' },
  { id: 4, contentId: 1, name: '내레이션', type: CharacterType.NARRATOR, color: '#64748b' }
]

const CASTS: Cast[] = [
  { creatorId: 101, creatorName: '김성우', characterIds: [1, 4] },
  { creatorId: 102, creatorName: '이보이스', characterIds: [2] },
  { creatorId: 103, creatorName: '박나레', characterIds: [3] }
]

/* ──────────────────────────── 회차 목록 ──────────────────────────── */

export const MOCK_EPISODES: EpisodeSummary[] = [
  {
    id: 1,
    contentId: 1,
    contentTitle: '첫사랑 리바이벌',
    episodeNo: 1,
    title: '재회',
    status: EpisodeStatus.REVIEWING,
    cutCount: 5,
    lineCount: 12,
    adoptedLineCount: 9,
    totalAdoptableCount: 14,
    updatedAt: '2026-06-17T08:12:00.000Z'
  },
  {
    id: 2,
    contentId: 1,
    contentTitle: '첫사랑 리바이벌',
    episodeNo: 2,
    title: '흔들림',
    status: EpisodeStatus.RECORDING,
    cutCount: 4,
    lineCount: 10,
    adoptedLineCount: 3,
    totalAdoptableCount: 12,
    updatedAt: '2026-06-16T22:40:00.000Z'
  },
  {
    id: 3,
    contentId: 2,
    contentTitle: '심야 식당의 비밀',
    episodeNo: 7,
    title: '단골의 사정',
    status: EpisodeStatus.READY,
    cutCount: 6,
    lineCount: 15,
    adoptedLineCount: 0,
    totalAdoptableCount: 15,
    updatedAt: '2026-06-15T11:05:00.000Z'
  },
  {
    id: 4,
    contentId: 2,
    contentTitle: '심야 식당의 비밀',
    episodeNo: 6,
    title: '비 오는 날',
    status: EpisodeStatus.APPROVED,
    cutCount: 5,
    lineCount: 11,
    adoptedLineCount: 11,
    totalAdoptableCount: 11,
    updatedAt: '2026-06-14T03:30:00.000Z'
  },
  {
    id: 5,
    contentId: 3,
    contentTitle: '용사 파티 해고일지',
    episodeNo: 3,
    title: '길드 등록',
    status: EpisodeStatus.DRAFT,
    cutCount: 0,
    lineCount: 0,
    adoptedLineCount: 0,
    totalAdoptableCount: 0,
    updatedAt: '2026-06-13T09:00:00.000Z'
  },
  {
    id: 6,
    contentId: 3,
    contentTitle: '용사 파티 해고일지',
    episodeNo: 2,
    title: '추방 통보',
    status: EpisodeStatus.SCHEDULED,
    cutCount: 7,
    lineCount: 18,
    adoptedLineCount: 18,
    totalAdoptableCount: 18,
    updatedAt: '2026-06-12T14:22:00.000Z'
  }
]

/* ──────────────────────────── 회차 상세(컷·라인) ──────────────────────────── */

/** ep1 의 컷·라인. 채택 진행이 섞여 있어 채택 화면 데모에 적합. */
function buildEpisode1Cuts(): Cut[] {
  const ep = 1
  const cuts: Cut[] = [
    {
      id: 11,
      episodeId: ep,
      position: 1,
      imageUrl: mockCutImage('CUT 1', 800, 1100, 0),
      imageWidth: 800,
      imageHeight: 1100,
      cropBox: { x: 0.05, y: 0.1, w: 0.9, h: 0.5 },
      holdMs: 400,
      transition: CutTransition.NONE,
      lines: [
        {
          id: 111,
          cutId: 11,
          episodeId: ep,
          position: 1,
          text: '...정말 오랜만이네.',
          characterId: 4,
          gapBeforeMs: 0,
          anchorY: 0.2,
          selectedTakeByCreator: { 101: 1001 }
        },
        {
          id: 112,
          cutId: 11,
          episodeId: ep,
          position: 2,
          text: '여기서 널 다시 볼 줄은 몰랐어.',
          characterId: 1,
          gapBeforeMs: 250,
          anchorY: 0.55,
          selectedTakeByCreator: { 101: 1003 }
        }
      ]
    },
    {
      id: 12,
      episodeId: ep,
      position: 2,
      imageUrl: mockCutImage('CUT 2', 800, 900, 1),
      imageWidth: 800,
      imageHeight: 900,
      cropBox: { x: 0, y: 0.2, w: 1, h: 0.45 },
      holdMs: 300,
      transition: CutTransition.FADE,
      lines: [
        {
          id: 121,
          cutId: 12,
          episodeId: ep,
          position: 1,
          text: '도윤아, 그동안 어떻게 지냈어?',
          characterId: 1,
          gapBeforeMs: 300,
          anchorY: 0.4,
          selectedTakeByCreator: { 101: 1010 }
        },
        {
          id: 122,
          cutId: 12,
          episodeId: ep,
          position: 2,
          // 음수 gap = 겹침(말 끊고 들어옴).
          text: '그냥... 그럭저럭.',
          characterId: 2,
          gapBeforeMs: -150,
          anchorY: 0.7,
          selectedTakeByCreator: {} // 미채택
        }
      ]
    },
    {
      id: 13,
      episodeId: ep,
      position: 3,
      imageUrl: mockCutImage('CUT 3', 800, 1300, 2),
      imageWidth: 800,
      imageHeight: 1300,
      cropBox: { x: 0.1, y: 0.05, w: 0.8, h: 0.4 },
      holdMs: 600,
      transition: CutTransition.NONE,
      lines: [
        {
          id: 131,
          cutId: 13,
          episodeId: ep,
          position: 1,
          text: '(두 사람 사이에 흐르는 어색한 침묵)',
          characterId: 4,
          gapBeforeMs: 500,
          anchorY: null, // 균등 분배 폴백 데모
          selectedTakeByCreator: { 101: 1020 }
        }
      ]
    }
  ]
  return cuts
}

const EPISODE_DETAILS: Record<number, EpisodeDetail> = {
  1: {
    ...MOCK_EPISODES[0],
    cuts: buildEpisode1Cuts(),
    characters: CHARACTERS,
    casts: CASTS
  }
}

/** 상세가 없는 회차는 ep1 구조를 복제해 채운다(데모 일관성). */
export function getEpisodeDetail(id: number): EpisodeDetail {
  const existing = EPISODE_DETAILS[id]
  if (existing) return existing
  const summary = MOCK_EPISODES.find((e) => e.id === id) ?? MOCK_EPISODES[0]
  const base = buildEpisode1Cuts().map((c) => ({ ...c, episodeId: id }))
  return { ...summary, cuts: base, characters: CHARACTERS, casts: CASTS }
}

/* ──────────────────────────── 녹음(채택 화면) ──────────────────────────── */

/**
 * 라인별 제출된 녹음 take 목록(mock). (line × creator) 별 여러 take.
 * docs §13: 채택은 (lineId, creatorId)별 1개.
 */
export function getRecordingsForLine(lineId: number): Recording[] {
  // 결정적 mock: lineId seed 로 캐스트별 1~3 take 생성.
  const recs: Recording[] = []
  let recId = lineId * 100
  const cast = CASTS
  cast.forEach((c, ci) => {
    const takeCount = ((lineId + ci) % 3) + 1
    for (let t = 1; t <= takeCount; t++) {
      recId += 1
      const statusPool = [
        RecordingStatus.APPROVED,
        RecordingStatus.REVIEW,
        RecordingStatus.RECORDED,
        RecordingStatus.REJECTED
      ]
      const status = statusPool[(lineId + ci + t) % statusPool.length]
      recs.push({
        id: recId,
        lineId,
        episodeId: 1,
        creatorId: c.creatorId,
        take: t,
        durationMs: 1200 + ((lineId * 7 + ci * 13 + t * 29) % 1800),
        status,
        rejectReason: status === RecordingStatus.REJECTED ? '발음 뭉개짐 — 재녹음 요청' : undefined,
        waveform: mockWaveform(recId)
      })
    }
  })
  return recs
}

export { CHARACTERS as MOCK_CHARACTERS, CASTS as MOCK_CASTS }
