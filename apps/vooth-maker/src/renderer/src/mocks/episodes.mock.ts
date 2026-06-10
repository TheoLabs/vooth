/**
 * 멀티캐스팅 도메인 mock 데이터.
 *
 * 백엔드(작품/회차/대사/녹음) API는 아직 없으므로 UI를 먼저 만들기 위한 샘플.
 * 회차 3개, 각 회차 3~5컷, 각 컷 2~4 대사, 대사별로 0~N개의 성우 녹음(상태 혼합)을
 * 두어 멀티캐스팅(한 대사에 여러 성우)이 화면에서 잘 보이도록 구성했다.
 *
 * 컷 이미지: 렌더러 CSP가 `img-src 'self' data:` 만 허용하므로 외부 URL은 차단된다.
 * → 인라인 `data:` SVG placeholder만 사용한다 (CSP-safe, 외부 요청 없음).
 */

import type { Episode, RecordingStatus } from '../types/domain'

/** 샘플 성우 목록 */
export const MOCK_VOICE_ACTORS = [
  { id: 'va-001', name: '김하늘' },
  { id: 'va-002', name: '박서준' },
  { id: 'va-003', name: '이도윤' },
  { id: 'va-004', name: '최유나' }
] as const

/** CSP-safe 컷 placeholder: 외부 URL 없이 인라인 data: SVG 로 "컷 N" 회색 박스를 그린다. */
function cutPlaceholder(order: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#e2e8f0"/>
  <rect x="1" y="1" width="638" height="358" fill="none" stroke="#cbd5e1" stroke-width="2"/>
  <text x="320" y="190" font-family="sans-serif" font-size="40" font-weight="700" fill="#94a3b8" text-anchor="middle">컷 ${order}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

let recordingSeq = 0

/** 녹음 1건 생성 헬퍼 (성우 인덱스 + 상태 + 오디오 길이 ms) */
function rec(
  lineId: string,
  vaIndex: number,
  status: RecordingStatus,
  durationMs: number
): {
  id: string
  lineId: string
  voiceActorId: string
  voiceActorName: string
  status: RecordingStatus
  audioUrl?: string
  durationMs: number
} {
  recordingSeq += 1
  const va = MOCK_VOICE_ACTORS[vaIndex]
  // 실제 오디오는 아직 없음. 완료/녹음됨 상태만 placeholder audioUrl 을 둔다(미사용).
  const hasAudio = status === 'DONE' || status === 'RECORDED' || status === 'REVIEW'
  return {
    id: `rec-${String(recordingSeq).padStart(3, '0')}`,
    lineId,
    voiceActorId: va.id,
    voiceActorName: va.name,
    status,
    durationMs,
    ...(hasAudio ? { audioUrl: `mock://audio/${lineId}/${va.id}.webm` } : {})
  }
}

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'ep-001',
    webtoonId: 'wt-moonlight',
    webtoonTitle: '달빛 기사단',
    episodeNo: 1,
    title: '프롤로그 - 깨어난 검',
    cuts: [
      {
        id: 'ep001-cut-1',
        order: 1,
        imageUrl: cutPlaceholder(1),
        holdMs: 500,
        lines: [
          {
            id: 'ep001-l1',
            order: 1,
            text: '드디어... 천 년의 봉인이 풀리는구나.',
            character: '검의 정령',
            gapBeforeMs: 0,
            // 완료(DONE) take 를 최종으로 선택
            selectedRecordingId: 'rec-001',
            recordings: [
              rec('ep001-l1', 0, 'DONE', 4200),
              rec('ep001-l1', 1, 'REVIEW', 3900)
            ]
          },
          {
            id: 'ep001-l2',
            order: 2,
            text: '누구냐! 거기 있는 게.',
            character: '아린',
            // 음수 gap → 앞 대사와 겹쳐 시작(동시 발화 예시).
            gapBeforeMs: -1000,
            selectedRecordingId: 'rec-003',
            recordings: [rec('ep001-l2', 2, 'RECORDED', 2100)]
          }
        ]
      },
      {
        id: 'ep001-cut-2',
        order: 2,
        imageUrl: cutPlaceholder(2),
        holdMs: 700,
        lines: [
          {
            id: 'ep001-l3',
            order: 1,
            text: '나는 너를 오래도록 기다려 왔다.',
            character: '검의 정령',
            gapBeforeMs: 0,
            // 멀티캐스팅이지만 아직 최종 take 미정 (선택 없음 → "미정")
            recordings: [
              rec('ep001-l3', 0, 'DONE', 3600),
              rec('ep001-l3', 3, 'DONE', 3300)
            ]
          },
          {
            id: 'ep001-l4',
            order: 2,
            text: '(이게 무슨 일이지...)',
            character: '아린',
            gapBeforeMs: 300,
            recordings: []
          },
          {
            id: 'ep001-l5',
            order: 3,
            text: '두려워 말거라.',
            character: '검의 정령',
            gapBeforeMs: 0,
            recordings: [rec('ep001-l5', 1, 'PENDING', 1800)]
          }
        ]
      },
      {
        id: 'ep001-cut-3',
        order: 3,
        imageUrl: cutPlaceholder(3),
        holdMs: 400,
        lines: [
          {
            id: 'ep001-l6',
            order: 1,
            text: '이 검을 들어라. 그것이 너의 운명이다.',
            character: '검의 정령',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-007',
            recordings: [rec('ep001-l6', 0, 'DONE', 4000)]
          },
          {
            id: 'ep001-l7',
            order: 2,
            text: '내... 운명?',
            character: '아린',
            gapBeforeMs: 500,
            recordings: []
          }
        ]
      },
      {
        id: 'ep001-cut-4',
        order: 4,
        imageUrl: cutPlaceholder(4),
        holdMs: 800,
        lines: [
          {
            id: 'ep001-l8',
            order: 1,
            text: '쿠르릉— (멀리서 들려오는 천둥소리)',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-008',
            recordings: [rec('ep001-l8', 2, 'DONE', 2600)]
          }
        ]
      }
    ]
  },
  {
    id: 'ep-002',
    webtoonId: 'wt-moonlight',
    webtoonTitle: '달빛 기사단',
    episodeNo: 2,
    title: '은빛 숲의 약속',
    cuts: [
      {
        id: 'ep002-cut-1',
        order: 1,
        imageUrl: cutPlaceholder(1),
        holdMs: 500,
        lines: [
          {
            id: 'ep002-l1',
            order: 1,
            text: '숲이... 노래하고 있어.',
            character: '아린',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-009',
            recordings: [rec('ep002-l1', 0, 'RECORDED', 2400)]
          },
          {
            id: 'ep002-l2',
            order: 2,
            text: '경계를 늦추지 마라. 여긴 안전하지 않다.',
            character: '카엘',
            gapBeforeMs: 300,
            selectedRecordingId: 'rec-010',
            recordings: [
              rec('ep002-l2', 1, 'REVIEW', 3500),
              rec('ep002-l2', 2, 'REJECTED', 3100)
            ]
          }
        ]
      },
      {
        id: 'ep002-cut-2',
        order: 2,
        imageUrl: cutPlaceholder(2),
        holdMs: 400,
        lines: [
          {
            id: 'ep002-l3',
            order: 1,
            text: '저기, 빛이 보여요!',
            character: '아린',
            gapBeforeMs: 0,
            recordings: []
          },
          {
            id: 'ep002-l4',
            order: 2,
            text: '함정일 수도 있다.',
            character: '카엘',
            gapBeforeMs: 0,
            recordings: [rec('ep002-l4', 3, 'PENDING', 1900)]
          },
          {
            id: 'ep002-l5',
            order: 3,
            text: '그래도 가봐야 해요.',
            character: '아린',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-013',
            recordings: [rec('ep002-l5', 0, 'RECORDED', 2300)]
          }
        ]
      },
      {
        id: 'ep002-cut-3',
        order: 3,
        imageUrl: cutPlaceholder(3),
        holdMs: 600,
        lines: [
          {
            id: 'ep002-l6',
            order: 1,
            text: '여기는... 옛 기사단의 성소.',
            character: '카엘',
            gapBeforeMs: 0,
            // 멀티 take 이지만 최종 미정
            recordings: [
              rec('ep002-l6', 1, 'RECORDED', 3000),
              rec('ep002-l6', 3, 'RECORDED', 2800)
            ]
          },
          {
            id: 'ep002-l7',
            order: 2,
            text: '약속의 증표가 여기 있을 거예요.',
            character: '아린',
            gapBeforeMs: 800,
            recordings: []
          }
        ]
      },
      {
        id: 'ep002-cut-4',
        order: 4,
        imageUrl: cutPlaceholder(4),
        holdMs: 300,
        lines: [
          {
            id: 'ep002-l8',
            order: 1,
            text: '조심해! 누군가 우릴 지켜보고 있어.',
            character: '카엘',
            gapBeforeMs: 0,
            recordings: [rec('ep002-l8', 2, 'PENDING', 2700)]
          },
          {
            id: 'ep002-l9',
            order: 2,
            text: '...!',
            character: '아린',
            gapBeforeMs: 300,
            recordings: []
          }
        ]
      },
      {
        id: 'ep002-cut-5',
        order: 5,
        imageUrl: cutPlaceholder(5),
        holdMs: 1000,
        lines: [
          {
            id: 'ep002-l10',
            order: 1,
            text: '우리는 다시 만날 것을 약속한다.',
            character: '카엘',
            gapBeforeMs: 0,
            recordings: [rec('ep002-l10', 1, 'PENDING', 3200)]
          }
        ]
      }
    ]
  },
  {
    id: 'ep-003',
    webtoonId: 'wt-seoul2099',
    webtoonTitle: '서울 2099',
    episodeNo: 7,
    title: '네온 거리의 추격',
    cuts: [
      {
        id: 'ep003-cut-1',
        order: 1,
        imageUrl: cutPlaceholder(1),
        holdMs: 300,
        lines: [
          {
            id: 'ep003-l1',
            order: 1,
            text: '놓치지 마! 저 골목으로 들어갔어!',
            character: '진',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-018',
            recordings: [
              rec('ep003-l1', 2, 'DONE', 2900),
              rec('ep003-l1', 3, 'DONE', 2600)
            ]
          },
          {
            id: 'ep003-l2',
            order: 2,
            text: '시스템, 추적 모드 활성화.',
            character: '루나',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-020',
            recordings: [rec('ep003-l2', 0, 'DONE', 2200)]
          }
        ]
      },
      {
        id: 'ep003-cut-2',
        order: 2,
        imageUrl: cutPlaceholder(2),
        holdMs: 400,
        lines: [
          {
            id: 'ep003-l3',
            order: 1,
            text: '대상 위치 확인. 전방 200미터.',
            character: 'AI 보이스',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-021',
            recordings: [rec('ep003-l3', 1, 'DONE', 2500)]
          },
          {
            id: 'ep003-l4',
            order: 2,
            text: '빌어먹을, 발이 빠르군.',
            character: '진',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-022',
            recordings: [rec('ep003-l4', 2, 'REVIEW', 1700)]
          },
          {
            id: 'ep003-l5',
            order: 3,
            text: '내가 위에서 막을게.',
            character: '루나',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-023',
            recordings: [rec('ep003-l5', 0, 'DONE', 2000)]
          }
        ]
      },
      {
        id: 'ep003-cut-3',
        order: 3,
        imageUrl: cutPlaceholder(3),
        holdMs: 500,
        lines: [
          {
            id: 'ep003-l6',
            order: 1,
            text: '항복해. 도망칠 곳은 없어.',
            character: '진',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-024',
            recordings: [rec('ep003-l6', 2, 'DONE', 2400)]
          },
          {
            id: 'ep003-l7',
            order: 2,
            text: '흥, 너희가 날 잡을 수 있을 것 같아?',
            character: '정체불명',
            gapBeforeMs: 500,
            recordings: []
          }
        ]
      },
      {
        id: 'ep003-cut-4',
        order: 4,
        imageUrl: cutPlaceholder(4),
        holdMs: 700,
        lines: [
          {
            id: 'ep003-l8',
            order: 1,
            text: '쾅— (폭발음)',
            gapBeforeMs: 0,
            selectedRecordingId: 'rec-025',
            recordings: [rec('ep003-l8', 3, 'DONE', 1500)]
          },
          {
            id: 'ep003-l9',
            order: 2,
            text: '루나! 괜찮아?!',
            character: '진',
            gapBeforeMs: 300,
            selectedRecordingId: 'rec-026',
            recordings: [rec('ep003-l9', 2, 'DONE', 2100)]
          }
        ]
      }
    ]
  }
]

/** id 로 회차 1건 조회 (없으면 undefined) */
export function getEpisodeById(id: string): Episode | undefined {
  return MOCK_EPISODES.find((ep) => ep.id === id)
}
