/**
 * vooth-maker 사이드바 네비 정의(스켈레톤).
 * - 홈만 구현됨. 나머지는 추후 화면 추가 시 disabled 를 해제한다.
 */
export interface MakerNavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  /** 아직 화면이 없으면 true (클릭 불가 + 준비중 뱃지) */
  disabled?: boolean;
}

export const MAKER_NAV: MakerNavItem[] = [
  { key: 'home', label: '홈', icon: '🏠', path: '/' },
  { key: 'works', label: '내 작품', icon: '🎬', path: '/works', disabled: true },
  { key: 'reviews', label: '검수', icon: '✅', path: '/reviews', disabled: true },
  { key: 'settings', label: '설정', icon: '⚙️', path: '/settings' },
];
