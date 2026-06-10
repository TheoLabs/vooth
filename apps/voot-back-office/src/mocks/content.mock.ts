import type { Episode, VoiceActor, Webtoon } from '../features/content/contentTypes';

/** CSP-safe 컷 placeholder: 인라인 data: SVG "컷 N" 회색 박스. */
export function cutPlaceholder(order: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
  <rect width="480" height="270" fill="#e2e8f0"/>
  <rect x="1" y="1" width="478" height="268" fill="none" stroke="#cbd5e1" stroke-width="2"/>
  <text x="240" y="145" font-family="sans-serif" font-size="34" font-weight="700" fill="#94a3b8" text-anchor="middle">컷 ${order}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const VOICE_ACTORS_MOCK: VoiceActor[] = [
  { id: 'va-001', name: '김하늘' },
  { id: 'va-002', name: '박서준' },
  { id: 'va-003', name: '이도윤' },
  { id: 'va-004', name: '최유나' },
  { id: 'va-005', name: '정해인' },
];

export const WEBTOONS_MOCK: Webtoon[] = [
  {
    id: 'wt-moonlight',
    title: '달빛 기사단',
    description: '천 년의 봉인이 풀리며 시작되는 검과 정령의 판타지.',
    status: 'ACTIVE',
    updatedAt: '2026-05-30T09:00:00.000Z',
    characters: [
      { id: 'ch-spirit', name: '검의 정령', color: '#6366f1', castVoiceActorIds: ['va-001', 'va-002'] },
      { id: 'ch-arin', name: '아린', color: '#ec4899', castVoiceActorIds: ['va-004'] },
      { id: 'ch-kael', name: '카엘', color: '#0ea5e9', castVoiceActorIds: ['va-003'] },
    ],
  },
  {
    id: 'wt-seoul2099',
    title: '서울 2099',
    description: '네온이 흐르는 미래 도시에서 펼쳐지는 추격극.',
    status: 'ACTIVE',
    updatedAt: '2026-06-02T11:30:00.000Z',
    characters: [
      { id: 'ch-jin', name: '진', color: '#f59e0b', castVoiceActorIds: ['va-005'] },
      { id: 'ch-luna', name: '루나', color: '#14b8a6', castVoiceActorIds: ['va-004'] },
    ],
  },
  {
    id: 'wt-starlight',
    title: '별빛 정거장',
    description: '우주 정거장에서 벌어지는 잔잔한 드라마.',
    status: 'DRAFT',
    updatedAt: '2026-06-05T08:00:00.000Z',
    characters: [],
  },
];

export const EPISODES_MOCK: Episode[] = [
  {
    id: 'ep-001',
    webtoonId: 'wt-moonlight',
    episodeNo: 1,
    title: '프롤로그 - 깨어난 검',
    status: 'OPEN',
    updatedAt: '2026-05-31T09:00:00.000Z',
    cuts: [
      {
        id: 'ep001-cut-1',
        order: 1,
        imageKey: cutPlaceholder(1),
        holdMs: 500,
        lines: [
          { id: 'ep001-l1', order: 1, text: '드디어... 천 년의 봉인이 풀리는구나.', characterId: 'ch-spirit', gapBeforeMs: 0 },
          { id: 'ep001-l2', order: 2, text: '누구냐! 거기 있는 게.', characterId: 'ch-arin', gapBeforeMs: -1000 },
        ],
      },
      {
        id: 'ep001-cut-2',
        order: 2,
        imageKey: cutPlaceholder(2),
        holdMs: 700,
        lines: [
          { id: 'ep001-l3', order: 1, text: '나는 너를 오래도록 기다려 왔다.', characterId: 'ch-spirit', gapBeforeMs: 0 },
          { id: 'ep001-l4', order: 2, text: '(이게 무슨 일이지...)', characterId: 'ch-arin', gapBeforeMs: 300 },
        ],
      },
    ],
  },
  {
    id: 'ep-002',
    webtoonId: 'wt-moonlight',
    episodeNo: 2,
    title: '은빛 숲의 약속',
    status: 'DRAFT',
    updatedAt: '2026-06-01T09:00:00.000Z',
    cuts: [
      {
        id: 'ep002-cut-1',
        order: 1,
        imageKey: cutPlaceholder(1),
        holdMs: 500,
        lines: [
          { id: 'ep002-l1', order: 1, text: '숲이... 노래하고 있어.', characterId: 'ch-arin', gapBeforeMs: 0 },
          { id: 'ep002-l2', order: 2, text: '경계를 늦추지 마라.', characterId: 'ch-kael', gapBeforeMs: 300 },
        ],
      },
    ],
  },
  {
    id: 'ep-003',
    webtoonId: 'wt-seoul2099',
    episodeNo: 7,
    title: '네온 거리의 추격',
    status: 'RECORDING',
    updatedAt: '2026-06-03T09:00:00.000Z',
    cuts: [
      {
        id: 'ep003-cut-1',
        order: 1,
        imageKey: cutPlaceholder(1),
        holdMs: 300,
        lines: [
          { id: 'ep003-l1', order: 1, text: '놓치지 마! 저 골목으로 들어갔어!', characterId: 'ch-jin', gapBeforeMs: 0 },
          { id: 'ep003-l2', order: 2, text: '시스템, 추적 모드 활성화.', characterId: 'ch-luna', gapBeforeMs: 0 },
        ],
      },
    ],
  },
];
