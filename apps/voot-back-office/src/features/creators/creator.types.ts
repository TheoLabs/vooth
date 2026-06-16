/**
 * 성우(크리에이터) 목록 화면 도메인 타입 + 목(mock) 데이터.
 * - core-api 연동 전 UI/UX 확인용. 실제 API 연결 시 이 파일의 query 함수만 교체하면 된다.
 * - 성우 = CREATOR 계정. core-api `Creator` 엔티티는 nickname/bio + account(email, 가입일) 만 가진다.
 *   (음색/상태/평점/성별 같은 필드는 도메인에 없으므로 표시하지 않는다.)
 * - castingCount/episodeCount 는 캐스팅·회차 도메인에서 집계되는 값으로, 여기서는 목 값으로 둔다.
 */

export interface CreatorWork {
  title: string;
  role: string;
  episodes: number;
}

export interface Creator {
  id: number;
  /** 활동명 */
  nickname: string;
  email: string;
  bio: string;
  /** 참여(캐스팅) 작품 수 — 캐스팅 도메인 집계 */
  castingCount: number;
  /** 녹음 완료 회차 수 — 회차 도메인 집계 */
  episodeCount: number;
  /** 가입일(UTC ISO) */
  joinedAt: string;
  recentWorks: CreatorWork[];
}

/** 활동명에서 아바타 배경색을 결정적으로 뽑는다. */
const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ---- 목 데이터 --------------------------------------------------------------

const STAGE_NAMES = [
  '하리', '루나', '제이', '소이', '테오', '민트', '라온', '시아', '네오', '유키',
  '베리', '단오', '하루', '코코', '리오', '마호', '노을', '다온', '세라', '윤슬',
  '보리', '가온', '초아', '한별', '이루', '새벽',
];

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

export const MOCK_CREATORS: Creator[] = STAGE_NAMES.map((nickname, i) => {
  const castingCount = 1 + ((i * 2) % 9);
  const episodeCount = castingCount * (3 + (i % 6));
  const joined = new Date(Date.UTC(2024, i % 12, 1 + (i % 27), 3, 0, 0));

  return {
    id: i + 1,
    nickname,
    email: `cv${String(i + 1).padStart(2, '0')}@vooth.studio`,
    bio: `${castingCount}개 작품에 참여한 성우입니다.`,
    castingCount,
    episodeCount,
    joinedAt: joined.toISOString(),
    recentWorks: makeWorks(i, 2 + (i % 2)),
  };
});

// ---- 목 조회(검색 + 페이지네이션) -------------------------------------------

export interface CreatorListQuery {
  searchKey?: 'nickname' | 'email';
  searchValue?: string;
  page?: number;
  limit?: number;
}

export function queryCreators(q: CreatorListQuery): { items: Creator[]; total: number } {
  let list = MOCK_CREATORS;

  if (q.searchValue) {
    const needle = q.searchValue.toLowerCase();
    const key = q.searchKey ?? 'nickname';
    list = list.filter((c) => c[key].toLowerCase().includes(needle));
  }

  const total = list.length;
  const page = q.page ?? 1;
  const limit = q.limit ?? 30;
  const start = (page - 1) * limit;
  return { items: list.slice(start, start + limit), total };
}
