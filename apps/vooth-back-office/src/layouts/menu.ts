/**
 * 백오피스 최상위 메뉴 IA(스켈레톤).
 * - 사이드바 네비(AppLayout)와 라우팅(App.tsx)이 공유하는 단일 정의.
 * - path 가 있으면 라우트로 연결되는 리프(또는 그룹 자체가 화면).
 */
export interface MenuLeaf {
  key: string;
  label: string;
  path: string;
}

export interface MenuGroup {
  key: string;
  label: string;
  /** 그룹 자체가 화면이면 path, 하위 메뉴가 있으면 children */
  path?: string;
  children?: MenuLeaf[];
}

export const MENU_TREE: MenuGroup[] = [
  { key: 'dashboard', label: '대시보드', path: '/' },
  {
    key: 'contents',
    label: '컨텐츠',
    children: [
      { key: 'contents-list', label: '작품 관리', path: '/contents' },
      { key: 'contents-tags', label: '태그 관리', path: '/contents/tags' },
    ],
  },
  {
    key: 'creators',
    label: '크리에이터',
    children: [
      { key: 'creators-list', label: '성우 목록', path: '/creators' },
      { key: 'creators-castings', label: '캐스팅', path: '/creators/castings' },
    ],
  },
  { key: 'reviews', label: '검수', path: '/reviews' },
  {
    key: 'settlements',
    label: '정산',
    children: [
      { key: 'settlements-list', label: '정산 내역', path: '/settlements' },
      { key: 'settlements-approvals', label: '정산 승인', path: '/settlements/approvals' },
    ],
  },
  {
    key: 'marketing',
    label: '마케팅',
    children: [
      { key: 'marketing-banners', label: '배너·추천', path: '/marketing/banners' },
      { key: 'marketing-events', label: '이벤트', path: '/marketing/events' },
      { key: 'marketing-push', label: '푸시·알림', path: '/marketing/push' },
    ],
  },
  { key: 'analytics', label: '분석(통계)', path: '/analytics' },
  {
    key: 'accounts',
    label: '계정관리',
    children: [
      { key: 'accounts-list', label: '관리자 계정', path: '/accounts' },
      { key: 'accounts-roles', label: '역할', path: '/roles' },
      { key: 'accounts-permissions', label: '권한', path: '/permissions' },
    ],
  },
  {
    key: 'support',
    label: '고객지원',
    children: [
      { key: 'support-inquiries', label: '1:1 문의', path: '/support/inquiries' },
      { key: 'support-reports', label: '신고', path: '/support/reports' },
      { key: 'support-notices', label: '공지·FAQ', path: '/support/notices' },
    ],
  },
  {
    key: 'settings',
    label: '설정',
    children: [
      { key: 'settings-policies', label: '약관·정책', path: '/settings/policies' },
      { key: 'settings-system', label: '시스템', path: '/settings/system' },
    ],
  },
];

/** App.tsx 라우팅용으로 모든 리프(path, label)를 평탄화 */
export const MENU_ROUTES: { path: string; label: string }[] = MENU_TREE.flatMap((group) => {
  if (group.children) {
    return group.children.map((leaf) => ({ path: leaf.path, label: leaf.label }));
  }
  return group.path ? [{ path: group.path, label: group.label }] : [];
});
