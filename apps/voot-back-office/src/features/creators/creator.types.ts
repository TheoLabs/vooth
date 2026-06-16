/**
 * 성우(크리에이터) 목록 화면 뷰모델.
 * - 목록은 `GET /admins/creators` 로 실제 조회한다(AdminCreatorResponseDto).
 * - 실제 데이터: 활동명(nickname)·본명(account.name)·이메일(account.email)·소개(bio)·가입일·avatarFileId.
 *   (검색은 nickname 만 지원.)
 * - 캐스팅/회차 집계(참여 작품 수·녹음 회차·최근 작품)는 아직 API 가 없어 목(mock)으로 채운다.
 *   집계 API 가 준비되면 toCreator() 의 mock 보강 부분만 교체하면 된다.
 */
import type { AdminCreator } from '../../api/creator.api';

export interface CreatorWork {
  title: string;
  role: string;
  episodes: number;
}

export interface Creator {
  id: number;
  /** 활동명 */
  nickname: string;
  /** 본명(account.name) */
  realName: string;
  email: string;
  bio: string;
  avatarFileId: number | null;
  /** 가입일(UTC ISO) */
  joinedAt: string;
  // --- 이하 mock (집계 API 준비 전) ---
  /** 참여(캐스팅) 작품 수 */
  castingCount: number;
  /** 녹음 완료 회차 수 */
  episodeCount: number;
  recentWorks: CreatorWork[];
}

export interface CreatorListQuery {
  searchValue?: string;
  page?: number;
  limit?: number;
}

/** 활동명에서 아바타 배경색을 결정적으로 뽑는다. */
const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ---- mock 보강(집계 API 준비 전, creator.id 로 결정적 생성) -------------------

const WORK_TITLES = [
  '달빛 정원', '비밀의 화원', '회귀한 영애', '검은 고양이', '폭군의 비서', '별을 삼킨 밤',
  '재벌집 막내', '마법서점 일기', '심해의 노래', '겨울 끝의 봄',
];
const WORK_ROLES = ['주연', '조연', '내레이션', '단역'];

function makeWorks(seed: number, count: number): CreatorWork[] {
  return Array.from({ length: count }, (_, k) => ({
    title: WORK_TITLES[(seed * 3 + k) % WORK_TITLES.length],
    role: WORK_ROLES[(seed + k) % WORK_ROLES.length],
    episodes: 4 + ((seed + k * 5) % 20),
  }));
}

/** AdminCreator → 성우 목록 뷰모델. 집계는 id 기반 mock. */
export function toCreator(creator: AdminCreator): Creator {
  const seed = creator.id;
  const castingCount = 1 + ((seed * 2) % 9);
  const episodeCount = castingCount * (3 + (seed % 6));
  return {
    id: creator.id,
    nickname: creator.nickname,
    realName: creator.account.name,
    email: creator.account.email,
    bio: creator.bio ?? '',
    avatarFileId: creator.avatarFileId,
    joinedAt: creator.createdAt ?? '',
    // --- mock ---
    castingCount,
    episodeCount,
    recentWorks: makeWorks(seed, 2 + (seed % 2)),
  };
}
