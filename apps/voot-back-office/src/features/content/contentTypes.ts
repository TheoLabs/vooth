/**
 * 콘텐츠 관리 도메인 타입 (mock 기반).
 * 설계 근거: docs/content-domain-design.md
 * 작품(Webtoon) ── 등장인물(Character)[] + 캐스팅
 *    └ 회차(Episode) ── 컷(Cut)[] ── 대사(Line)[]
 * 타임라인(start/end)은 저장하지 않고 duration/gap/hold 로 유도(여기선 편집만).
 */

import { TagColor } from '@vooth/shared';

export { TagColor };

export type WebtoonStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type EpisodeStatus = 'DRAFT' | 'OPEN' | 'RECORDING' | 'REVIEW' | 'PUBLISHED';

export interface VoiceActor {
  id: string;
  name: string;
}

/** 태그 — 작품(Webtoon)과 N:M. 색상은 공유 enum(TagColor). */
export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

/** 표시 순서용 색상 목록(공유 enum). */
export const TAG_COLOR_VALUES = Object.values(TagColor);

/** TagColor → AntD Tag color 토큰 매핑(렌더링은 프론트 책임). */
export const TAG_COLOR_ANTD: Record<TagColor, string> = {
  [TagColor.RED]: 'red',
  [TagColor.ORANGE]: 'orange',
  [TagColor.GOLD]: 'gold',
  [TagColor.GREEN]: 'green',
  [TagColor.CYAN]: 'cyan',
  [TagColor.BLUE]: 'blue',
  [TagColor.INDIGO]: 'geekblue',
  [TagColor.PURPLE]: 'purple',
  [TagColor.MAGENTA]: 'magenta',
  [TagColor.GRAY]: 'default',
};

/** TagColor → 한국어 라벨. */
export const TAG_COLOR_LABEL: Record<TagColor, string> = {
  [TagColor.RED]: '빨강',
  [TagColor.ORANGE]: '주황',
  [TagColor.GOLD]: '금색',
  [TagColor.GREEN]: '초록',
  [TagColor.CYAN]: '청록',
  [TagColor.BLUE]: '파랑',
  [TagColor.INDIGO]: '남색',
  [TagColor.PURPLE]: '보라',
  [TagColor.MAGENTA]: '자홍',
  [TagColor.GRAY]: '회색',
};

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
  /** N:M 태그 참조. */
  tagIds: string[];
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
