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

/**
 * 작업 순서: ① 대사 앵커 설정 → ② 성우 녹음(vooth-maker) → ③ 연출·효과(작업 목록).
 * 앵커 설정은 녹음 전 단계라 연출 에디터와 분리된 독립 메뉴로 둔다.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '대시보드', icon: '◎', end: true },
  { to: '/anchors', label: '컨텐츠', icon: '▦' },
  { to: '/episodes', label: '연출 큐', icon: '☰' },
  { to: '/render', label: '렌더', icon: '▶' }
]
