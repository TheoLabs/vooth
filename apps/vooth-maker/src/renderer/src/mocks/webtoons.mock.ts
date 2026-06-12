/**
 * 콘텐츠(작품) 카탈로그 mock.
 *
 * "작업 목록"(내 작업)과 별개로, 실제 어떤 콘텐츠(작품)와 회차가 존재하는지 탐색하기 위한 데이터.
 * 회차 실데이터는 episodes.mock 의 MOCK_EPISODES 를 webtoonId 로 연결해 재사용한다.
 * 썸네일은 렌더러 CSP(img-src 'self' data:) 때문에 외부 URL 대신 인라인 data: SVG 만 사용.
 */

import type { Episode, Webtoon } from '../types/domain'
import { MOCK_EPISODES } from './episodes.mock'

/** CSP-safe 썸네일: 제목 머리글자를 그린 그라데이션 박스(data: SVG). */
function thumbnail(title: string, from: string, to: string): string {
  const initial = title.trim().charAt(0)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="480" height="300" fill="url(#g)"/>
  <text x="240" y="170" font-family="sans-serif" font-size="120" font-weight="800" fill="rgba(255,255,255,0.9)" text-anchor="middle">${initial}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const MOCK_WEBTOONS: Webtoon[] = [
  {
    id: 'wt-moonlight',
    title: '달빛 기사단',
    description: '천 년의 봉인이 풀리며 시작되는 검과 정령의 판타지.',
    thumbnailUrl: thumbnail('달빛 기사단', '#6366f1', '#8b5cf6'),
    status: 'PUBLISHED',
    voiceActors: ['김하늘', '박서준', '이도윤']
  },
  {
    id: 'wt-seoul2099',
    title: '서울 2099',
    description: '네온이 흐르는 미래 도시에서 펼쳐지는 추격극.',
    thumbnailUrl: thumbnail('서울 2099', '#0ea5e9', '#22d3ee'),
    status: 'PUBLISHED',
    voiceActors: ['최유나', '정해인']
  },
  {
    id: 'wt-starlight',
    title: '별빛 정거장',
    description: '우주 정거장에서 벌어지는 잔잔한 드라마.',
    thumbnailUrl: thumbnail('별빛 정거장', '#f59e0b', '#f97316'),
    status: 'PUBLISHED',
    voiceActors: ['한지민']
  },
  {
    id: 'wt-deepblue',
    title: '심해의 노래',
    description: '깊은 바다 속 비밀을 쫓는 모험. (게시 전)',
    thumbnailUrl: thumbnail('심해의 노래', '#0d9488', '#14b8a6'),
    status: 'DRAFT',
    voiceActors: []
  }
]

/** id 로 작품 1건 조회 (없으면 undefined). */
export function getWebtoonById(id: string): Webtoon | undefined {
  return MOCK_WEBTOONS.find((w) => w.id === id)
}

/** 작품에 속한 회차들 (episodeNo 오름차순). */
export function getEpisodesByWebtoonId(webtoonId: string): Episode[] {
  return MOCK_EPISODES.filter((ep) => ep.webtoonId === webtoonId).sort(
    (a, b) => a.episodeNo - b.episodeNo
  )
}

/** 작품의 회차 수. */
export function getEpisodeCount(webtoonId: string): number {
  return getEpisodesByWebtoonId(webtoonId).length
}
