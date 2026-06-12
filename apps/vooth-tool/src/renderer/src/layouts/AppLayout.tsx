import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './AppLayout.css'

interface NavItemDef {
  to: string
  label: string
  icon: string
  /** 아직 구현되지 않은 섹션은 비활성화로 구조만 노출한다. */
  disabled?: boolean
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/', label: '연출 · 제작', icon: '🎬' },
  { to: '/render', label: '렌더', icon: '🎞️', disabled: true },
  { to: '/settings', label: '설정', icon: '⚙️', disabled: true }
]

/** 현재 경로에 맞는 헤더 타이틀. */
function titleFromPath(pathname: string): string {
  if (pathname.startsWith('/episodes')) return '연출'
  return '연출 · 제작'
}

/**
 * 인증·승인을 통과한 사용자가 머무는 메인 데스크톱 레이아웃.
 * 좌측 사이드바(네비) + 상단 헤더(사용자/로그아웃) + 콘텐츠 영역(<Outlet/>).
 * 콘텐츠 영역만 내부 스크롤되며, 윈도우 자체에는 스크롤이 생기지 않는다.
 */
export function AppLayout(): React.JSX.Element {
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__mark">V</span>
          <span className="app-brand__name">Vooth Tool</span>
        </div>

        <nav className="app-nav">
          {NAV_ITEMS.map((item) =>
            item.disabled ? (
              <span key={item.to} className="app-nav__item app-nav__item--disabled">
                <span className="app-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="app-nav__label">{item.label}</span>
                <span className="app-nav__badge">준비중</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  isActive ? 'app-nav__item app-nav__item--active' : 'app-nav__item'
                }
              >
                <span className="app-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="app-nav__label">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header__title">{titleFromPath(location.pathname)}</h1>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
