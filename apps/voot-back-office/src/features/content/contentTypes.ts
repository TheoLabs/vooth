/**
 * 콘텐츠 관리 도메인 타입 (mock 기반).
 * 설계 근거: docs/content-domain-design.md
 * 작품(Webtoon) ── 등장인물(Character)[] + 캐스팅
 *    └ 회차(Episode) ── 컷(Cut)[] ── 대사(Line)[]
 * 타임라인(start/end)은 저장하지 않고 duration/gap/hold 로 유도(여기선 편집만).
 */

export type WebtoonStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type EpisodeStatus = 'DRAFT' | 'OPEN' | 'RECORDING' | 'REVIEW' | 'PUBLISHED';

export interface VoiceActor {
  id: string;
  name: string;
}

/** 등장인물 + 캐스팅(멀티캐스팅: 성우 여러 명). */
export interface Character {
  id: string;
  name: string;
  color?: string;
  castVoiceActorIds: string[];
}

export interface Webtoon {
  id: string;
  title: string;
  description?: string;
  status: WebtoonStatus;
  characters: Character[];
  updatedAt: string;
}

export interface Line {
  id: string;
  order: number;
  text: string;
  characterId?: string;
  /** 앞 간격(ms). 음수=앞 대사와 겹침. */
  gapBeforeMs: number;
}

export interface Cut {
  id: string;
  order: number;
  /** S3 키(placeholder). 실제 업로드는 추후. */
  imageKey?: string;
  /** 대사 종료 후 컷 유지(ms). */
  holdMs: number;
  lines: Line[];
}

export interface Episode {
  id: string;
  webtoonId: string;
  episodeNo: number;
  title: string;
  status: EpisodeStatus;
  cuts: Cut[];
  updatedAt: string;
}

export const WEBTOON_STATUS_META: Record<WebtoonStatus, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'default' },
  ACTIVE: { label: '활성', color: 'green' },
  ARCHIVED: { label: '보관', color: 'gold' },
};

export const EPISODE_STATUS_META: Record<EpisodeStatus, { label: string; color: string }> = {
  DRAFT: { label: '편집중', color: 'default' },
  OPEN: { label: '녹음 게시', color: 'blue' },
  RECORDING: { label: '녹음중', color: 'geekblue' },
  REVIEW: { label: '검수중', color: 'gold' },
  PUBLISHED: { label: '게시 완료', color: 'green' },
};

/** 회차 상태 전이 순서(다음 단계 버튼용). */
export const EPISODE_STATUS_FLOW: EpisodeStatus[] = [
  'DRAFT',
  'OPEN',
  'RECORDING',
  'REVIEW',
  'PUBLISHED',
];
