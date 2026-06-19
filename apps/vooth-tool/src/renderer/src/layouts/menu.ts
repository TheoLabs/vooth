/**
 * 사이드바 네비 단일 정의. 사이드바·라우팅에서 공유.
 * vooth-tool = 연출·제작 화면만(등록/관리·녹음 UI 없음).
 */
export interface NavItem {
  to: string
  label: string
  icon: string
  /** index 라우트(정확 일치)로 active 판정할지. */
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '대시보드', icon: '◎', end: true },
  { to: '/episodes', label: '작업 목록', icon: '☰' },
  { to: '/render', label: '렌더', icon: '▶' }
]
